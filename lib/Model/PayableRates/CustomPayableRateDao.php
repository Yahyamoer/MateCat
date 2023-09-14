<?php

namespace PayableRates;

use DataAccess_AbstractDao;
use Database;
use DateTime;
use PDO;

class CustomPayableRateDao extends DataAccess_AbstractDao
{
    const TABLE = 'payable_rate_templates';
    const TABLE_JOB_PIVOT = 'job_custom_payable_rates';

    const query_by_uid_name = "SELECT * FROM " . self::TABLE . " WHERE uid = :uid AND name = :name";
    const query_by_id = "SELECT * FROM " . self::TABLE . " WHERE id = :id";

    /**
     * @var null
     */
    private static $instance = null;

    /**
     * @return CustomPayableRateDao|null
     */
    private static function getInstance(){
        if(!isset(self::$instance)){
            self::$instance = new self();
        }

        return self::$instance;
    }

    /**
     * @param $uid
     * @param int $current
     * @param int $pagination
     *
     * @return array
     */
    public static function getAllPaginated($uid, $current = 1, $pagination = 20)
    {
        $conn = \Database::obtain()->getConnection();

        $stmt = $conn->prepare( "SELECT count(id) as count FROM ".self::TABLE." WHERE uid = :uid");
        $stmt->execute([
            'uid' => $uid
        ]);

        $count = $stmt->fetch(\PDO::FETCH_ASSOC);
        $pages = ceil($count['count'] / $pagination);
        $prev = ($current !== 1) ? "/api/v3/payable_rate?page=".($current-1) : null;
        $next = ($current < $pages) ? "/api/v3/payable_rate?page=".($current+1) : null;
        $offset = ($current - 1) * $pagination;

        $models = [];

        $stmt = $conn->prepare( "SELECT id FROM ".self::TABLE." WHERE uid = :uid LIMIT $pagination OFFSET $offset ");
        $stmt->execute([
            'uid' => $uid
        ]);

        foreach ($stmt->fetchAll(\PDO::FETCH_ASSOC) as $model){
            $models[] = self::getById($model['id']);
        }

        return [
            'current_page' => $current,
            'per_page' => $pagination,
            'last_page' => $pages,
            'prev' => $prev,
            'next' => $next,
            'items' => $models,
        ];
    }

    /**
     * @param $id
     * @param int $ttl
     * @return CustomPayableRateStruct
     */
    public static function getById( $id, $ttl = 60 ) {
        $stmt = self::getInstance()->_getStatementForCache(self::query_by_id);
        $result = self::getInstance()->setCacheTTL( $ttl )->_fetchObject( $stmt, new CustomPayableRateStruct(), [
            'id' => $id,
        ] );

        return @$result[0];
    }

    /**
     * @param $uid
     * @param $name
     * @param int $ttl
     * @return CustomPayableRateStruct
     */
    public static function getByUidAndName( $uid, $name, $ttl = 60 ) {
        $stmt = self::getInstance()->_getStatementForCache(self::query_by_uid_name);
        $result = self::getInstance()->setCacheTTL( $ttl )->_fetchObject( $stmt, new CustomPayableRateStruct(), [
            'uid' => $uid,
            'name' => $name,
        ] );

        return @$result[0];
    }

    /**
     * @param CustomPayableRateStruct $customPayableRateStruct
     * @return int
     * @throws \Exception
     */
    public static function save( CustomPayableRateStruct $customPayableRateStruct ) {

        $sql = "INSERT INTO " . self::TABLE .
            " ( `uid`, `version`, `name`, `breakdowns`, `created_at`, `modified_at` ) " .
            " VALUES " .
            " ( :uid, :version, :name, :breakdowns, :now, :now ); ";

        $conn = Database::obtain()->getConnection();
        $stmt = $conn->prepare( $sql );
        $stmt->execute( [
            'uid'        => $customPayableRateStruct->uid,
            'version'    => 1,
            'name'       => $customPayableRateStruct->name,
            'breakdowns' => $customPayableRateStruct->breakdownsToJson(),
            'now'        => (new DateTime())->format('Y-m-d H:i:s'),
        ] );

        return $conn->lastInsertId();
    }

    /**
     * @param CustomPayableRateStruct $customPayableRateStruct
     * @return int
     * @throws \Exception
     */
    public static function update( CustomPayableRateStruct $customPayableRateStruct ) {

        $sql = "UPDATE " . self::TABLE . " SET `uid` = :uid, `version` = :version, `name` = :name, `breakdowns` = :breakdowns, `modified_at` = :now WHERE id = :id ";

        $conn = Database::obtain()->getConnection();
        $stmt = $conn->prepare( $sql );
        $stmt->execute( [
            'id'         => $customPayableRateStruct->id,
            'uid'        => $customPayableRateStruct->uid,
            'version'    => ($customPayableRateStruct->version + 1),
            'name'       => $customPayableRateStruct->name,
            'breakdowns' => $customPayableRateStruct->breakdownsToJson(),
            'now'        => (new DateTime())->format('Y-m-d H:i:s'),
        ] );

        self::destroyQueryByIdCache($conn, $customPayableRateStruct->id);
        self::destroyQueryByUidAndNameCache($conn, $customPayableRateStruct->uid, $customPayableRateStruct->name);

        return $customPayableRateStruct->id;

    }

    /**
     * @param $id
     * @return int
     */
    public static function remove( $id ) {
        $conn = Database::obtain()->getConnection();
        $stmt = $conn->prepare( "DELETE FROM ".self::TABLE." WHERE id = :id " );
        $stmt->execute( [ 'id' => $id ] );

        self::destroyQueryByIdCache($conn, $id);

        return $stmt->rowCount();
    }

    /**
     * validate a json against schema and then
     * create a Payable Rate model template from it
     *
     * @param      $json
     * @param null $uid
     *
     * @return int
     * @throws \Swaggest\JsonSchema\InvalidValue
     * @throws \Exception
     */
    public static function createFromJSON($json, $uid = null)
    {
        self::validateJSON($json);

        $customPayableRateStruct = new CustomPayableRateStruct();
        $customPayableRateStruct->hydrateFromJSON($json);

        if($uid){
            $customPayableRateStruct->uid = $uid;
        }

        return self::save($customPayableRateStruct);
    }

    /**
     * @param $json
     * @throws \Swaggest\JsonSchema\InvalidValue
     * @throws \Exception
     */
    private static function validateJSON($json)
    {
        $validatorObject = new \Validator\JSONValidatorObject();
        $validatorObject->json = $json;
        $jsonSchema = file_get_contents( __DIR__ . '/../../../inc/validation/schema/payable_rate.json' );
        $validator = new \Validator\JSONValidator($jsonSchema);
        $validator->validate($validatorObject);

        if(!$validator->isValid()){
            throw $validator->getErrors()[0]->error;
        }
    }

    /**
     * @param CustomPayableRateStruct $customPayableRateStruct
     * @param                       $json
     *
     * @return mixed
     * @throws \Swaggest\JsonSchema\InvalidValue
     * @throws \Exception
     */
    public static function editFromJSON(CustomPayableRateStruct $customPayableRateStruct, $json)
    {
        self::validateJSON($json);
        $customPayableRateStruct->hydrateFromJSON($json);

        return self::update($customPayableRateStruct);
    }

    /**
     * @param PDO $conn
     * @param string $id
     */
    private static function destroyQueryByIdCache(PDO $conn, $id)
    {
        $stmt = $conn->prepare( self::query_by_id );
        self::getInstance()->_destroyObjectCache( $stmt, [ 'id' => $id, ] );
    }

    /**
     * @param PDO $conn
     * @param string $uid
     * @param string $name
     */
    private static function destroyQueryByUidAndNameCache(PDO $conn, $uid, $name)
    {
        $stmt = $conn->prepare( self::query_by_uid_name );
        self::getInstance()->_destroyObjectCache( $stmt, [ 'uid' => $uid, 'name' => $name,  ] );
    }

    /**
     * @param int $modelId
     * @param int $idJob
     * @param int $version
     * @param string $name
     *
     * @return string
     */
    public static function assocModelToJob($modelId, $idJob, $version, $name)
    {
        $sql = "INSERT INTO " . self::TABLE_JOB_PIVOT .
            " ( `id_job`, `custom_payable_rate_model_id`, `custom_payable_rate_model_version`, `custom_payable_rate_model_name` ) " .
            " VALUES " .
            " ( :id_job, :model_id, :version, :model_name ); ";

        $conn = Database::obtain()->getConnection();
        $stmt = $conn->prepare( $sql );
        $stmt->execute( [
            'id_job'     => $idJob,
            'model_id'   => $modelId,
            'version'    => $version,
            'model_name' => $name,
        ] );

        return $conn->lastInsertId();
    }
}
