<?php


namespace Translations;

use Chunks_ChunkStruct;
use Constants_TranslationStatus;
use DataAccess\ShapelessConcreteStruct;
use DataAccess_AbstractDao;
use Jobs\WarningsCountStruct;
use ReflectionException;

class WarningDao extends DataAccess_AbstractDao {

    protected string $_query_warnings_by_chunk = "
          SELECT count(1) AS count, jobs.id AS id_job, jobs.password
            FROM jobs
              JOIN segment_translations st ON st.id_job = jobs.id AND id_segment BETWEEN jobs.job_first_segment AND jobs.job_last_segment
          WHERE ( st.warning & :level ) = :level
            AND id = :id AND password = :password
            AND st.status != :status
        ";

    /**
     * @throws ReflectionException
     */
    public function getWarningsByProjectIds( $projectIds ): array {

        $statuses[] = Constants_TranslationStatus::STATUS_TRANSLATED;
        $statuses[] = Constants_TranslationStatus::STATUS_APPROVED;

        $arrayCount   = count( $projectIds );
        $rowCount     = ( $arrayCount ? $arrayCount - 1 : 0 );
        $placeholders = sprintf( "?%s", str_repeat( ",?", $rowCount ) );

        $sql = "
        SELECT 	COUNT( jobs.id ) as count,
                jobs.id AS id_job,
                jobs.password,
                GROUP_CONCAT( st.id_segment ORDER BY id_segment ) as segment_list
                    FROM segment_translations st
                      JOIN jobs ON st.id_job = jobs.id AND st.id_segment BETWEEN jobs.job_first_segment AND jobs.job_last_segment
                        WHERE st.warning = 1
                        AND id_project IN( $placeholders )
                        AND st.status IN( ?, ? )
                        GROUP BY id_job, password;
        ";

        $params = array_merge( $projectIds, $statuses );

        $con = $this->database->getConnection();

        $stmt = $con->prepare( $sql );

        return $this->_fetchObject( $stmt, new WarningsCountStruct(), $params );

    }

    /**
     * @param Chunks_ChunkStruct $chunk
     *
     * @return int
     */
    public function getErrorsByChunk( Chunks_ChunkStruct $chunk ): int {
        $con = $this->database->getConnection();

        $stmt = $con->prepare( $this->_query_warnings_by_chunk );
        $stmt->execute( [
                'id'       => $chunk->id,
                'password' => $chunk->password,
                'level'    => WarningModel::ERROR,
                'status'   => Constants_TranslationStatus::STATUS_NEW
        ] );

        $result = $stmt->fetch();
        if ( $result ) {
            return $result[ 'count' ];
        } else {
            return 0;
        }
    }

    protected function _buildResult( $array_result ) {
        // TODO: Implement _buildResult() method.
    }

    /**
     * @throws ReflectionException
     */
    public static function getWarningsByJobIdAndPassword( $jid, $jpassword ): array {

        $thisDao = new self();
        $db      = $thisDao->getDatabaseHandler();

        $query = "SELECT id_segment, serialized_errors_list
		FROM segment_translations
		JOIN jobs ON jobs.id = id_job AND id_segment BETWEEN jobs.job_first_segment AND jobs.job_last_segment
		WHERE jobs.id = :id_job
		  AND jobs.password = :password
		  AND segment_translations.status != :segment_status 
		-- following is a condition on bitmask to filter by severity ERROR
		  AND warning & 1 = 1 ";

        $stmt = $db->getConnection()->prepare( $query );

        return $thisDao->_fetchObject( $stmt, new ShapelessConcreteStruct(), [
                'id_job'         => $jid,
                'password'       => $jpassword,
                'segment_status' => Constants_TranslationStatus::STATUS_NEW
        ] );

    }


}