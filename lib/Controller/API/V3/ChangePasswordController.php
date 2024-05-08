<?php

namespace API\V3;

use API\V2\ChunkController;
use API\V2\Validators\LoginValidator;
use CatUtils;
use Database;
use Exception;
use Features\ReviewExtended\ReviewUtils;
use Jobs_JobDao;
use LQA\ChunkReviewDao;
use Projects_ProjectDao;
use Utils;

class ChangePasswordController extends ChunkController
{
    protected function afterConstruct()
    {
        $this->appendValidator( new LoginValidator( $this ) );
    }

    public function changePassword()
    {
        $res             = filter_var($this->request->param('res'), FILTER_SANITIZE_STRING, [ 'flags' => FILTER_FLAG_STRIP_LOW | FILTER_FLAG_STRIP_HIGH ] );
        $id              = filter_var($this->request->param('id'), FILTER_SANITIZE_NUMBER_INT );
        $password        = filter_var($this->request->param('password'), FILTER_SANITIZE_STRING, [ 'flags' => FILTER_FLAG_STRIP_LOW | FILTER_FLAG_STRIP_HIGH ] );
        $new_password    = filter_var($this->request->param('new_password'), FILTER_SANITIZE_STRING, [ 'flags' => FILTER_FLAG_STRIP_LOW | FILTER_FLAG_STRIP_HIGH ] );
        $revision_number = filter_var($this->request->param('revision_number'), FILTER_SANITIZE_NUMBER_INT );
        $undo            = filter_var($this->request->param('undo'), FILTER_VALIDATE_BOOLEAN );

        if(
            empty($id) or
            empty($password) or
            empty($new_password)
        ){
            $code = 400;
            $this->response->status()->setCode( $code );
            $this->response->json( [
                'error' => 'Missing required parameters [`id `, `password`, `new_password`]'
            ] );
            exit();
        }

        if ( $undo ) {
            $new_pwd    = $new_password;
            $actual_pwd = $password;
        } else {
            $new_pwd    = Utils::randomString( 15, true );
            $actual_pwd = $password;
        }

        $user = $this->getUser();

        try {
            $this->changeThePassword($user, $res, $id, $actual_pwd, $new_pwd, $revision_number);

            $this->response->status()->setCode(200);
            $this->response->json( [
                'id'         => $id,
                'new_pwd'    => $new_pwd,
                'actual_pwd' => $actual_pwd,
            ] );
            exit();


        } catch (\Exception $exception){
            $this->response->status()->setCode(500);
            $this->response->json( [
                'error' => $exception->getMessage()
            ] );
            exit();
        }
    }

    /**
     * @param \Users_UserStruct $user
     * @param $res
     * @param $id
     * @param $actual_pwd
     * @param $new_password
     * @param null $revision_number
     * @throws Exception
     */
    private function changeThePassword(\Users_UserStruct $user, $res, $id, $actual_pwd, $new_password, $revision_number = null)
    {
        if ( $res == "prj" ) {

            $pStruct = Projects_ProjectDao::findByIdAndPassword( $id, $actual_pwd );

            if($pStruct === null){
                throw new Exception('Project not found');
            }

            $owner = $pStruct->getOriginalOwner();

            if($owner->uid !== $user->uid){
                throw new Exception('This job does not belong to the logged user', 403);
            }

            $pDao    = new Projects_ProjectDao();
            $pDao->changePassword( $pStruct, $new_password );
            $pDao->destroyCacheById( $id );

            // invalidate cache for ProjectData
            $pDao->destroyCacheForProjectData($pStruct->id, $pStruct->password);

            $pStruct->getFeaturesSet()->run( 'project_password_changed', $pStruct, $actual_pwd );

        } else {

            Database::obtain()->begin();

            if ( $revision_number ) {

                $jStruct = CatUtils::getJobFromIdAndAnyPassword( $id, $actual_pwd );

                if($jStruct === null){
                    throw new Exception('Job not found');
                }

                $owner = $jStruct->getProject()->getOriginalOwner();

                if($owner->uid !== $user->uid){
                    throw new Exception('This job does not belong to the logged user', 403);
                }

                $source_page = ReviewUtils::revisionNumberToSourcePage( $revision_number );
                $dao         = new ChunkReviewDao();
                $dao->updateReviewPassword( $id, $actual_pwd, $new_password, $source_page );
                $jStruct->getProject()
                    ->getFeaturesSet()
                    ->run( 'review_password_changed', $id, $actual_pwd, $new_password, $revision_number );


            } else {
                $jStruct = Jobs_JobDao::getByIdAndPassword( $id, $actual_pwd );
                $jDao    = new Jobs_JobDao();
                $jDao->changePassword( $jStruct, $new_password );
                $jStruct->getProject()
                    ->getFeaturesSet()
                    ->run( 'job_password_changed', $jStruct, $actual_pwd );
            }

            // invalidate cache for ProjectData
            $pDao = new Projects_ProjectDao();
            $pDao->destroyCacheForProjectData($jStruct->getProject()->id, $jStruct->getProject()->password);

            Database::obtain()->commit();
        }
    }
}