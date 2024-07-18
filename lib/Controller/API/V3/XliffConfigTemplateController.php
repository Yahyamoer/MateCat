<?php

namespace API\V3;

use API\V2\KleinController;
use API\V2\Validators\LoginValidator;
use Exception;
use Xliff\XliffConfigTemplateDao;
use INIT;
use Klein\Response;
use Validator\Errors\JSONValidatorException;

class XliffConfigTemplateController extends KleinController {
    protected function afterConstruct() {
        parent::afterConstruct();
        $this->appendValidator( new LoginValidator( $this ) );
    }

    /**
     * Get all entries
     */
    public function all() {
        $currentPage = ( isset( $_GET[ 'page' ] ) ) ? $_GET[ 'page' ] : 1;
        $pagination  = ( isset( $_GET[ 'perPage' ] ) ) ? $_GET[ 'perPage' ] : 20;

        if ( $pagination > 200 ) {
            $pagination = 200;
        }

        $uid = $this->getUser()->uid;

        try {
            $this->response->status()->setCode( 200 );

            return $this->response->json( XliffConfigTemplateDao::getAllPaginated( $uid, $currentPage, $pagination ) );

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
    public function get() {
        $id = filter_var( $this->request->id, FILTER_SANITIZE_STRING, FILTER_FLAG_STRIP_HIGH | FILTER_FLAG_ENCODE_LOW );

        try {
            $model = XliffConfigTemplateDao::getById( $id );

            if ( empty( $model ) ) {
                $this->response->code( 404 );

                return $this->response->json( [
                        'error' => 'Model not found'
                ] );
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
            $errorCode = $exception->getCode() >= 400 ? $exception->getCode() : 500;
            $this->response->code( $errorCode );

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
    public function create() {
        // accept only JSON
        if ( !$this->isJsonRequest() ) {
            $this->response->code( 400 );

            return $this->response->json( [
                    'message' => 'Method not allowed'
            ] );
        }

        // try to create the template
        try {
            $json   = $this->request->body();
            $struct = XliffConfigTemplateDao::createFromJSON( $json, $this->getUser()->uid );

            $this->response->code( 201 );

            return $this->response->json( $struct );

        } catch ( JSONValidatorException $exception ) {
            $this->response->code( 500 );

            return $this->response->json( $exception );
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
    public function update() {
        // accept only JSON
        if ( !$this->isJsonRequest() ) {
            $this->response->code( 400 );

            return $this->response->json( [
                    'message' => 'Method not allowed'
            ] );
        }

        $id  = $this->request->param( 'id' );
        $uid = $this->getUser()->uid;

        $model = XliffConfigTemplateDao::getById( $id );

        if ( empty( $model ) ) {
            $this->response->code( 404 );

            return $this->response->json( [
                    'error' => 'Model not found'
            ] );
        }

        if ( $this->getUser()->uid !== $model->uid ) {
            $this->response->code( 401 );

            return $this->response->json( [
                    'error' => 'User not allowed'
            ] );
        }

        try {
            $json   = $this->request->body();
            $struct = XliffConfigTemplateDao::editFromJSON( $model, $json, $uid );

            $this->response->code( 200 );

            return $this->response->json( $struct );
        } catch ( JSONValidatorException $exception ) {
            $errorCode = $exception->getCode() >= 400 ? $exception->getCode() : 500;
            $this->response->code( $errorCode );

            return $this->response->json( $exception );
        } catch ( \Exception $exception ) {
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
    public function delete() {
        $id  = filter_var( $this->request->id, FILTER_SANITIZE_STRING, FILTER_FLAG_STRIP_HIGH | FILTER_FLAG_ENCODE_LOW );
        $uid = $this->getUser()->uid;

        try {
            $model = XliffConfigTemplateDao::getById( $id );

            if ( empty( $model ) ) {
                $this->response->code( 404 );

                return $this->response->json( [
                        'error' => 'Model not found'
                ] );
            }

            XliffConfigTemplateDao::remove( $id, $uid );

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
     * @return Response
     */
    public function schema() {
        return $this->response->json( $this->getModelSchema() );
    }

    /**
     * @return false|string
     */
    private function getModelSchema()
    {
        return json_decode( file_get_contents( INIT::$ROOT . '/inc/validation/schema/xliff_parameters.json' ) );
    }
}