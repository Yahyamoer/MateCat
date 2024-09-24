<?php
/**
 * Created by PhpStorm.
 * @author domenico domenico@translated.net / ostico@gmail.com
 * Date: 12/12/16
 * Time: 12.13
 *
 */

namespace API\V2;

use ActivityLog\ActivityLogDao;
use ActivityLog\ActivityLogStruct;
use API\Commons\KleinController;
use API\Commons\Validators\ChunkPasswordValidator;
use API\Commons\Validators\ProjectPasswordValidator;
use API\V2\Json\Activity;

class ActivityLogController extends KleinController {


    protected $rawLogContent;
    protected $project_data;

    public function allOnProject(){

        $validator = new ProjectPasswordValidator( $this );
        $validator->validate();

        $activityLogDao = new ActivityLogDao();
        $rawContent = $activityLogDao->getAllForProject( $validator->getIdProject() ) ;

        $formatted = new Activity( $rawContent ) ;
        $this->response->json( $formatted->render() );
    }

    public function lastOnProject(){

        $validator = new ProjectPasswordValidator( $this );
        $validator->validate();

        $activityLogDao = new ActivityLogDao();
        $rawContent = $activityLogDao->getLastActionInProject( $validator->getIdProject() ) ;

        $formatted = new Activity( $rawContent ) ;
        $this->response->json( array( 'activity' => $formatted->render() ) );

    }

    public function lastOnJob(){

        $validator = new ChunkPasswordValidator( $this );
        $validator->validate();

        $activityLogDao = new ActivityLogDao();
        $activityLogDao->whereConditions = ' id_job = :id_job ';
        $activityLogDao->epilogueString = " ORDER BY ID DESC LIMIT 1";
        $this->rawLogContent  = $activityLogDao->read(
                new ActivityLogStruct(),
                [ 'id_job' =>  $validator->getJobId() ]
        );

        $formatted = new Activity( $this->rawLogContent ) ;
        $this->response->json( array( 'activity' => $formatted->render() ) );

    }

}