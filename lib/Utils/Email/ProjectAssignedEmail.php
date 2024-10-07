<?php
/**
 * Created by PhpStorm.
 * User: fregini
 * Date: 16/02/2017
 * Time: 16:13
 */

namespace Email;


use CatUtils;
use Chunks_ChunkStruct;
use Exception;
use Projects_MetadataDao;
use Projects_ProjectStruct;
use Routes;
use Users_UserStruct;
use WordCount\WordCountStruct;

class ProjectAssignedEmail extends AbstractEmail {

    protected $user ;
    protected $project ;
    protected $assignee ;
    protected $title ;

    public  function __construct( Users_UserStruct $user, Projects_ProjectStruct $project, Users_UserStruct $assignee) {
        $this->user = $user ;
        $this->project = $project ;
        $this->assignee = $assignee ;

        $this->jobs = $project->getJobs();

        $this->title = "You've been assigned a project" ;

        $this->_setLayout('skeleton.html');
        $this->_setTemplate('Project/project_assigned_content.html');
    }

<<<<<<< Updated upstream
    protected function _getTemplateVariables()
    {
=======
    protected function _getTemplateVariables(): array {
>>>>>>> Stashed changes
        $words_count = [];
        foreach ( $this->jobs as $job ) {
            $jStruct  = new Chunks_ChunkStruct( $job->getArrayCopy() );
            $jobStats = new WordCountStruct();
            $jobStats->setIdJob( $jStruct->id );
            $jobStats->setDraftWords( $jStruct->draft_words + $jStruct->new_words ); // (draft_words + new_words) AS DRAFT
            $jobStats->setRejectedWords( $jStruct->rejected_words );
            $jobStats->setTranslatedWords( $jStruct->translated_words );
            $jobStats->setApprovedWords( $jStruct->approved_words );
            $stats         = CatUtils::getFastStatsForJob( $jobStats, false );
            $words_count[] = $stats[ Projects_MetadataDao::WORD_COUNT_RAW ][ 'total' ];
        }

        return [
                'user'        => $this->assignee->toArray(),
                'sender'      => $this->user->toArray(),
                'project'     => $this->project->toArray(),
                'words_count' => number_format( array_sum( $words_count ) ),
                'project_url' => Routes::analyze( [
                        'project_name' => $this->project->name,
                        'id_project'   => $this->project->id,
                        'password'     => $this->project->password
                ] )
        ];
    }

<<<<<<< Updated upstream
    protected function _getLayoutVariables($messageBody = null)
    {
        $vars = parent::_getLayoutVariables();
        $vars['title'] = $this->title ;
=======
    protected function _getLayoutVariables( $messageBody = null ): array {
        $vars            = parent::_getLayoutVariables();
        $vars[ 'title' ] = $this->title;
>>>>>>> Stashed changes

        return $vars ;
    }

<<<<<<< Updated upstream
    public function send()
    {
        $recipient  = array( $this->assignee->email, $this->assignee->fullName() );
=======
    /**
     * @throws Exception
     */
    public function send() {
        $recipient = [ $this->assignee->email, $this->assignee->fullName() ];
>>>>>>> Stashed changes

        $this->doSend( $recipient, $this->title ,
            $this->_buildHTMLMessage(),
            $this->_buildTxtMessage( $this->_buildMessageContent() )
        );
    }

}