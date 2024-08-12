<?php

namespace API\V3;

use API\V2\KleinController;
use API\V2\Validators\LoginValidator;
use Exception;
use INIT;
use Klein\Response;
use PDOException;
use Projects\ProjectTemplateDao;
use Swaggest\JsonSchema\InvalidValue;
use Validator\Errors\JSONValidatorException;
use Validator\Errors\JsonValidatorGenericException;
use Validator\JSONValidator;
use Validator\JSONValidatorObject;

class ProjectTemplateController extends KleinController {
    protected function afterConstruct() {
        parent::afterConstruct();
        $this->appendValidator( new LoginValidator( $this ) );
    }

    /**
     * @param $json
     *
     * @throws InvalidValue
     * @throws JSONValidatorException
     * @throws JsonValidatorGenericException
     * @throws \Swaggest\JsonSchema\Exception
     */
    private function validateJSON( $json ) {
        $validatorObject       = new JSONValidatorObject();
        $validatorObject->json = $json;
        $jsonSchema            = file_get_contents( INIT::$ROOT . '/inc/validation/schema/project_template.json' );
        $validator             = new JSONValidator( $jsonSchema, true );
        $validator->validate( $validatorObject );
    }

    /**
     * Get all entries
     */
    public function all(): Response {

        $currentPage = $this->request->param( 'page' ) ?? 1;
        $pagination  = $this->request->param( 'perPage' ) ?? 20;

        if ( $pagination > 200 ) {
            $pagination = 200;
        }

        try {

            $uid = $this->getUser()->uid;
            $this->response->status()->setCode( 200 );

            return $this->response->json( ProjectTemplateDao::getAllPaginated( $uid, "/api/v3/project-template?page=", $currentPage, $pagination ) );

        } catch ( Exception $exception ) {
            $code = ( $exception->getCode() > 0 ) ? $exception->getCode() : 500;
            $this->response->status()->setCode( $code );

            return $this->response->json( [
                    'error' => $exception->getMessage()
            ] );
        }
    }

    /**
     * Get a single entry
     */
    public function get(): Response {
        $id = filter_var( $this->request->id, FILTER_SANITIZE_STRING, FILTER_FLAG_STRIP_HIGH | FILTER_FLAG_ENCODE_LOW );

        try {
            $model = ProjectTemplateDao::getByIdAndUser( $id, $this->getUser()->uid );

            if ( empty( $model ) ) {
                throw new Exception( 'Model not found', 404 );
            }

            if ( $model->uid !== $this->getUser()->uid ) {
                $this->response->code( 403 );

                return $this->response->json( [
                        'error' => 'You are not authorized to see this model'
                ] );
            }

            $this->response->status()->setCode( 200 );

            return $this->response->json( $model );

        } catch ( Exception $exception ) {
            $code = ( $exception->getCode() > 0 ) ? $exception->getCode() : 500;
            $this->response->status()->setCode( $code );

            return $this->response->json( [
                    'error' => $exception->getMessage()
            ] );
        }
    }

    /**
     * Create new entry
     *
     * @return Response
     */
    public function create(): Response {

        // try to create the template
        try {

            // accept only JSON
            if ( !$this->isJsonRequest() ) {
                throw new Exception( 'Bad Request', 400 );
            }

            $json = $this->request->body();
            $this->validateJSON( $json );

            $struct = ProjectTemplateDao::createFromJSON( $json, $this->getUser()->uid );

            $this->response->code( 201 );

            return $this->response->json( $struct );

        } catch ( JSONValidatorException|JsonValidatorGenericException|InvalidValue $exception ) {
            $errorCode = max( $exception->getCode(), 400 );
            $this->response->code( $errorCode );

            return $this->response->json( [ 'error' => $exception->getMessage() ] );
        } catch ( PDOException $e ) {
            if ( $e->getCode() == 23000 ) {
                $this->response->code( 400 );

                return $this->response->json( [
                        'error' => "Invalid unique template name"
                ] );
            } else {
                $this->response->code( 500 );

                return $this->response->json( [
                        'error' => $e->getMessage()
                ] );
            }
        } catch ( Exception $exception ) {

            $errorCode = $exception->getCode() >= 400 ? $exception->getCode() : 500;
            $this->response->code( $errorCode );

            return $this->response->json( [
                    'error' => $exception->getMessage()
            ] );
        }

    }

    /**
     * Update an entry
     *
     * @return Response
     * @throws Exception
     */
    public function update(): Response {

        try {

            // accept only JSON
            if ( $this->request->headers()->get( 'Content-Type' ) !== 'application/json' ) {
                throw new Exception( 'Bad Request', 400 );
            }

            $id   = $this->request->param( 'id' );
            $uid  = $this->getUser()->uid;
            $json = $this->request->body();
            $this->validateJSON( $json );

            // mark all templates as not default
            if ( $id == 0 ) {
                ProjectTemplateDao::markAsNotDefault( $uid, 0 );

                return $this->response->json( ProjectTemplateDao::getDefaultTemplate( $uid ) );
            }

            $model = ProjectTemplateDao::getByIdAndUser( $id, $uid );

            if ( empty( $model ) ) {
                throw new Exception( 'Model not found', 404 );
            }

            $struct = ProjectTemplateDao::editFromJSON( $model, $json, $uid );

            $this->response->code( 200 );

            return $this->response->json( $struct );
        } catch ( JSONValidatorException|JsonValidatorGenericException|InvalidValue  $exception ) {
            $errorCode = max( $exception->getCode(), 400 );
            $this->response->code( $errorCode );

            return $this->response->json( [ 'error' => $exception->getMessage() ] );
        } catch ( Exception $exception ) {
            $errorCode = $exception->getCode() >= 400 ? $exception->getCode() : 500;
            $this->response->code( $errorCode );

            return $this->response->json( [
                    'error' => $exception->getMessage()
            ] );
        }

    }

    /**
     * Delete an entry
     */
    public function delete(): Response {
        $id = filter_var( $this->request->id, FILTER_SANITIZE_STRING, FILTER_FLAG_STRIP_HIGH | FILTER_FLAG_ENCODE_LOW );

        try {

            $count = ProjectTemplateDao::remove( $id, $this->getUser()->uid );

            if ( $count == 0 ) {
                throw new Exception( 'Model not found', 404 );
            }

            return $this->response->json( [
                    'id' => (int)$id
            ] );

        } catch ( Exception $exception ) {
            $code = ( $exception->getCode() > 0 ) ? $exception->getCode() : 500;
            $this->response->status()->setCode( $code );

            return $this->response->json( [
                    'error' => $exception->getMessage()
            ] );
        }
    }

    /**
     * This is the Payable Rate Model JSON schema
     *
     * @return Response
     */
    public function schema(): Response {
        return $this->response->json( json_decode( $this->getProjectTemplateModelSchema() ) );
    }

    /**
     * @throws Exception
     */
    public function default() {

        $this->response->status()->setCode( 200 );
        $this->response->json(
                ProjectTemplateDao::getDefaultTemplate( $this->getUser()->uid )
        );

    }

    /**
     * @return false|string
     */
    private function getProjectTemplateModelSchema() {
        return file_get_contents( INIT::$ROOT . '/inc/validation/schema/project_template.json' );
    }
}
