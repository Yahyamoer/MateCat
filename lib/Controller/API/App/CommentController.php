<?php

namespace API\App;

use AMQHandler;
use API\Commons\KleinController;
use API\Commons\Validators\LoginValidator;
use Comments_CommentDao;
use Comments_CommentStruct;
use Database;
use Email\CommentEmail;
use Email\CommentMentionEmail;
use Email\CommentResolveEmail;
use INIT;
use Jobs_JobDao;
use Jobs_JobStruct;
use Log;
use Stomp\Transport\Message;
use Teams\MembershipDao;
use Url\JobUrlBuilder;
use Users_UserDao;
use Users_UserStruct;

class CommentController extends KleinController {

    protected function afterConstruct() {
        $this->appendValidator( new LoginValidator( $this ) );
    }

    public function getRange()
    {
        $data = [];
        $request = $this->validateTheRequest();

        $struct                = new Comments_CommentStruct();
        $struct->id_job        = $request[ 'id_job' ];
        $struct->first_segment = $request[ 'first_seg' ];
        $struct->last_segment  = $request[ 'last_seg' ];

        $commentDao = new Comments_CommentDao( Database::obtain() );

        $data[ 'entries' ] = [
            'comments' => $commentDao->getCommentsForChunk( $request['job'] )
        ];

        $data[ 'user' ] = [
            'full_name' => $this->user->fullName()
        ];

        return $this->response->json([
            "data" => $data
        ]);
    }

    public function resolve()
    {
        $request = $this->validateTheRequest();
        $prepareCommandData = $this->prepareCommentData($request);
        $comment_struct = $prepareCommandData['struct'];
        $users_mentioned_id = $prepareCommandData['users_mentioned_id'];
        $users_mentioned = $prepareCommandData['users_mentioned'];

        $commentDao       = new Comments_CommentDao( Database::obtain() );
        $new_record = $commentDao->resolveThread( $comment_struct );

        $payload = $this->enqueueComment($new_record, $request['job']->id_project, $request['id_job'], $request['id_client']);
        $users = $this->resolveUsers($comment_struct, $request['job'], $users_mentioned_id);
        $this->sendEmail($comment_struct, $request['job'], $users, $users_mentioned);

        return $this->response->json([
            "data" => [
                'entries' => $payload,
                'user' => [
                    'full_name' => $this->user->fullName()
                ]
            ]
        ]);
    }

    public function create()
    {
        $request = $this->validateTheRequest();
        $prepareCommandData = $this->prepareCommentData($request);
        $comment_struct = $prepareCommandData['struct'];
        $users_mentioned_id = $prepareCommandData['users_mentioned_id'];
        $users_mentioned = $prepareCommandData['users_mentioned'];

        $commentDao = new Comments_CommentDao( Database::obtain() );
        $new_record = $commentDao->saveComment( $comment_struct );

        foreach ( $users_mentioned as $user_mentioned ) {
            $mentioned_comment = $this->prepareMentionCommentData($request, $user_mentioned);
            $commentDao->saveComment( $mentioned_comment );
        }

        $commentDao->destroySegmentIdCache($request[ 'id_segment' ]);

        $payload = $this->enqueueComment($new_record, $request['job']->id_project, $request['id_job'], $request['id_client']);
        $users = $this->resolveUsers($comment_struct, $request['job'], $users_mentioned_id);
        $this->sendEmail($comment_struct, $request['job'], $users, $users_mentioned);

        return $this->response->json([
            "data" => [
                'entries' => $payload,
                'user' => [
                    'full_name' => $this->user->fullName()
                ]
            ]
        ]);
    }

    public function delete()
    {}

    /**
     * @return array|\Klein\Response
     * @throws \ReflectionException
     */
    private function validateTheRequest()
    {
        $id_client = filter_var( $this->request->param( 'id_client' ), FILTER_SANITIZE_STRING );
        $username = filter_var( $this->request->param( 'username' ), FILTER_SANITIZE_STRING );
        $id_job = filter_var( $this->request->param( 'id_job' ), FILTER_SANITIZE_NUMBER_INT );
        $id_segment = filter_var( $this->request->param( 'id_segment' ), FILTER_SANITIZE_NUMBER_INT );
        $source_page = filter_var( $this->request->param( 'source_page' ), FILTER_SANITIZE_NUMBER_INT );
        $revision_number = filter_var( $this->request->param( 'revision_number' ), FILTER_SANITIZE_NUMBER_INT );
        $first_seg = filter_var( $this->request->param( 'first_seg' ), FILTER_SANITIZE_NUMBER_INT );
        $last_seg = filter_var( $this->request->param( 'last_seg' ), FILTER_SANITIZE_NUMBER_INT );
        $id_comment = filter_var( $this->request->param( 'id_comment' ), FILTER_SANITIZE_NUMBER_INT );
        $password = filter_var( $this->request->param( 'password' ), FILTER_SANITIZE_STRING, [ 'flags' =>  FILTER_FLAG_STRIP_LOW | FILTER_FLAG_STRIP_HIGH ] );
        $message = filter_var( $this->request->param( 'message' ), FILTER_UNSAFE_RAW );
        $message = htmlspecialchars( $message );

        $job = Jobs_JobDao::getByIdAndPassword( $id_job, $password, 60 * 60 * 24 );

        if ( empty( $job ) ) {
            $this->response->code(400);

            return $this->response->json([
                "code" => -10,
                "message" => "wrong password"
            ]);
        }

        return [
            'id_client' => $id_client,
            'username' => $username,
            'id_job' => $id_job,
            'id_segment' => $id_segment,
            'source_page' => $source_page,
            'revision_number' => $revision_number,
            'first_seg' => $first_seg,
            'last_seg' => $last_seg,
            'id_comment' => $id_comment,
            'password' => $password,
            'message' => $message,
            'job' => $job,
        ];
    }

    /**
     * @param $request
     * @return array
     * @throws \ReflectionException
     */
    private function prepareCommentData($request)
    {
        $struct = new Comments_CommentStruct();

        $struct->id_segment      = $request[ 'id_segment' ];
        $struct->id_job          = $request[ 'id_job' ];
        $struct->full_name       = $request[ 'username' ];
        $struct->source_page     = $request[ 'source_page' ];
        $struct->message         = $request[ 'message' ];
        $struct->revision_number = $request[ 'revision_number' ];
        $struct->email           = $this->user->getEmail();
        $struct->uid             = $this->user->getUid();

        $user_mentions           = $this->resolveUserMentions($struct->message);
        $user_team_mentions      = $this->resolveTeamMentions($request['job'], $struct->message);
        $userDao                 = new Users_UserDao( Database::obtain() );
        $users_mentioned_id      = array_unique( array_merge( $user_mentions, $user_team_mentions ) );
        $users_mentioned         = $this->filterUsers( $userDao->getByUids( $users_mentioned_id ) );

        return [
            'struct' => $struct,
            'users_mentioned_id' => $users_mentioned_id,
            'users_mentioned' => $users_mentioned,
        ];
    }

    /**
     * @param $request
     * @param Users_UserStruct $user
     * @return Comments_CommentStruct
     */
    private function prepareMentionCommentData( $request, Users_UserStruct $user ) {
        $struct = new Comments_CommentStruct();

        $struct->id_segment   = $request[ 'id_segment' ];
        $struct->id_job       = $request[ 'id_job' ];
        $struct->full_name    = $user->fullName();
        $struct->source_page  = $request[ 'source_page' ];
        $struct->message      = "";
        $struct->message_type = Comments_CommentDao::TYPE_MENTION;
        $struct->email        = $user->getEmail();
        $struct->uid          = $user->getUid();

        return $struct;
    }

    /**
     * @param $message
     * @return array|mixed
     */
    private function resolveUserMentions($message) {
        return Comments_CommentDao::getUsersIdFromContent( $message );
    }

    /**
     * @param Jobs_JobStruct $job
     * @param $message
     * @return array
     * @throws \ReflectionException
     */
    private function resolveTeamMentions(Jobs_JobStruct $job, $message) {
        $users = [];

        if ( strstr( $message, "{@team@}" ) ) {
            $project     = $job->getProject();
            $memberships = ( new MembershipDao() )->setCacheTTL( 60 * 60 * 24 )->getMemberListByTeamId( $project->id_team, false );
            foreach ( $memberships as $membership ) {
                $users[] = $membership->uid;
            }
        }

        return $users;
    }

    /**
     * @param $users
     * @param array $uidSentList
     * @return array
     */
    private function filterUsers( $users, $uidSentList = [] ) {
        $userIsLogged = $this->userIsLogged;
        $current_uid  = $this->user->uid;

        // find deep duplicates
        $users = array_filter( $users, function ( $item ) use ( $userIsLogged, $current_uid, &$uidSentList ) {
            if ( $userIsLogged && $current_uid == $item->uid ) {
                return false;
            }

            // find deep duplicates
            if ( array_search( $item->uid, $uidSentList ) !== false ) {
                return false;
            }
            $uidSentList[] = $item->uid;

            return true;

        } );

        return $users;
    }

    /**
     * @param Comments_CommentStruct $comment
     * @param Jobs_JobStruct $job
     * @param $users_mentioned_id
     * @return array
     */
    private function resolveUsers(Comments_CommentStruct $comment, Jobs_JobStruct $job, $users_mentioned_id)
    {
        $commentDao = new Comments_CommentDao( Database::obtain() );
        $result     = $commentDao->getThreadContributorUids( $comment );

        $userDao = new Users_UserDao( Database::obtain() );
        $users   = $userDao->getByUids( $result );
        $userDao->setCacheTTL( 60 * 60 * 24 );
        $owner = $userDao->getProjectOwner( $job->id );

        if ( !empty( $owner->uid ) && !empty( $owner->email ) ) {
            array_push( $users, $owner );
        }

        $userDao->setCacheTTL( 60 * 10 );
        $assignee = $userDao->getProjectAssignee( $job->id_project );
        if ( !empty( $assignee->uid ) && !empty( $assignee->email ) ) {
            array_push( $users, $assignee );
        }

        return $this->filterUsers( $users, $users_mentioned_id );

    }

    /**
     * @param Comments_CommentStruct $comment
     * @param $id_project
     * @param $id_job
     * @param $id_client
     * @return false|string
     * @throws \Stomp\Exception\ConnectionException
     */
    private function enqueueComment(Comments_CommentStruct $comment, $id_project, $id_job, $id_client) {

        $payload = [
            'message_type'   => $comment->message_type,
            'message'        => $comment->message,
            'id'             => $comment->id,
            'id_segment'     => $comment->id_segment,
            'full_name'      => $comment->full_name,
            'email'          => $comment->email,
            'source_page'    => $comment->source_page,
            'formatted_date' => $comment->getFormattedDate(),
            'thread_id'      => $comment->thread_id,
            'timestamp'      => (int)$comment->timestamp,
        ];

        $message = json_encode( [
            '_type' => 'comment',
            'data'  => [
                'id_job'    => $id_job,
                'passwords' => $this->getProjectPasswords($id_project),
                'id_client' => $id_client,
                'payload'   => $payload
            ]
        ] );

        $queueHandler = new AMQHandler();
        $queueHandler->publishToTopic( INIT::$SSE_NOTIFICATIONS_QUEUE_NAME, new Message( $message ) );

        return $message;
    }

    /**
     * @param $id_project
     * @return \DataAccess\ShapelessConcreteStruct[]
     */
    private function projectData($id_project) {
        return ( new \Projects_ProjectDao() )->setCacheTTL( 60 * 60 )->getProjectData( $id_project );
    }

    /**
     * @param $id_project
     * @return array
     */
    private function getProjectPasswords($id_project) {
        $pws = [];

        foreach ( $this->projectData($id_project) as $chunk ) {
            $pws[] = $chunk[ 'jpassword' ];
        }

        return $pws;
    }

    /**
     * @param $id
     * @param $idSegment
     * @param $email
     * @param $sourcePage
     *
     * @throws StompException
     */
    private function enqueueDeleteCommentMessage($id, $idSegment, $email, $sourcePage)
    {
        $message = json_encode( [
            '_type' => 'comment',
            'data'  => [
                'id_job'    => $this->__postInput[ 'id_job' ],
                'passwords' => $this->getProjectPasswords(),
                'id_client' => $this->__postInput[ 'id_client' ],
                'payload'   => [
                    'message_type'   => "2",
                    'id'             => (int)$id,
                    'id_segment'     => $idSegment,
                    'email'          => $email,
                    'source_page'    => $sourcePage,
                ]
            ]
        ] );

        $queueHandler = new AMQHandler();
        $queueHandler->publishToTopic( INIT::$SSE_NOTIFICATIONS_QUEUE_NAME, new Message( $message ) );

    }

    /**
     * @param Comments_CommentStruct $comment
     * @param Jobs_JobStruct $job
     * @param array $users
     * @param array $users_mentioned
     * @return \Klein\Response
     */
    private function sendEmail(Comments_CommentStruct $comment, Jobs_JobStruct $job, array $users, array $users_mentioned) {

        $jobUrlStruct = JobUrlBuilder::createFromJobStruct($job, [
            'id_segment'         => $comment->id_segment,
            'skip_check_segment' => true
        ]);

        $url = $jobUrlStruct->getUrlByRevisionNumber($comment->revision_number);

        if(!$url){
            $this->response->code(404);

            return $this->response->json([
                "code" => -10,
                "message" => "No valid url was found for this project."
            ]);
        }

        Log::doJsonLog( $url );
        $project_data = $this->projectData($job->id_project);

        foreach ( $users_mentioned as $user_mentioned ) {
            $email = new CommentMentionEmail( $user_mentioned, $comment, $url, $project_data[ 0 ], $job );
            $email->send();
        }

        foreach ( $users as $user ) {
            if ( $comment->message_type == Comments_CommentDao::TYPE_RESOLVE ) {
                $email = new CommentResolveEmail( $user, $comment, $url, $project_data[ 0 ], $job );
            } else {
                $email = new CommentEmail( $user, $comment, $url, $project_data[ 0 ], $job );
            }

            $email->send();
        }
    }
}