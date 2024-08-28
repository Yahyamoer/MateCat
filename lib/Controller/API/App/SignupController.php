<?php

namespace API\App;

use Exception;
use Exceptions\ValidationError;
use FlashMessage;
use Klein\Response;
use Log;
use Predis\PredisException;
use Routes;
use Teams\InvitedUser;
use Users\PasswordResetModel;
use Users\RedeemableProject;
use Users\SignupModel;
use Utils;

class SignupController extends AbstractStatefulKleinController {

    use RateLimiterTrait;

    /**
     * @throws Exception
     */
    public function create() {

        $user = $this->request->param( 'user' );
        $userIp = Utils::getRealIpAddr();

        // rate limit on email
        $checkRateLimitOnEmail = $this->checkRateLimitResponse( $this->response, $user[ 'email' ], '/api/app/user', 3 );
        if ( $checkRateLimitOnEmail instanceof Response ) {
            $this->response = $checkRateLimitOnEmail;

            return;
        }

        // rate limit on IP
        $checkRateLimitOnIp = $this->checkRateLimitResponse( $this->response, $userIp, '/api/app/user', 3 );
        if ( $checkRateLimitOnIp instanceof Response ) {
            $this->response = $checkRateLimitOnIp;

            return;
        }

        $signup = new SignupModel( $user );
        $this->incrementRateLimitCounter( $userIp, '/api/app/user' );

        // email
        if ( $signup->valid() ) {
            $signup->process();
            $this->response->code( 200 );
        } else {
            $this->incrementRateLimitCounter( $user[ 'email' ], '/api/app/user' );
            $this->response->code( 400 );
            $this->response->json( [
                    'error' => [
                            'message' => $signup->getError()
                    ]
            ] );
        }
    }

    public function confirm() {
        try {
            $user = SignupModel::confirm( $this->request->param( 'token' ) );

            if ( InvitedUser::hasPendingInvitations() ) {
                InvitedUser::completeTeamSignUp( $user, $_SESSION[ 'invited_to_team' ] );
            }

            $project = new RedeemableProject( $user, $_SESSION );
            $project->tryToRedeem();

            if ( $project->getDestinationURL() ) {
                $this->response->redirect( $project->getDestinationURL() );
            } else {
                $this->response->redirect( $this->__flushWantedURL() );
            }

            FlashMessage::set( 'popup', 'profile', FlashMessage::SERVICE );
        } catch ( ValidationError $e ) {
            FlashMessage::set( 'confirmToken', $e->getMessage(), FlashMessage::ERROR );
            $this->response->redirect( $this->__flushWantedURL() );
        }

    }

    public function redeemProject() {
        $_SESSION[ 'redeem_project' ] = true;
        $this->response->code( 200 );
    }

    /**
     * Authenticates a user for a password reset.
     *
     * This method checks the rate limit, validates the user
     * and redirects the user to the desired URL if successful.
     * If an error occurs during the process, it increments the rate limit counter
     * and redirects the user to the application root.
     *
     * @throws ValidationError If a validation error occurs.
     * @throws Exception
     */
    public function authForPasswordReset() {
        try {
            $checkRateLimit = $this->checkRateLimitResponse( $this->response, $this->request->param( 'token' ), '/api/app/user/password_reset' );
            if ( $checkRateLimit instanceof Response ) {
                $this->response = $checkRateLimit;

                return;
            }

            $reset = new PasswordResetModel( $this->request->param( 'token' ), $_SESSION );
            $reset->validateUser();
            $this->response->redirect( $this->__flushWantedURL() );

            FlashMessage::set( 'popup', 'passwordReset', FlashMessage::SERVICE );

        } catch ( ValidationError $e ) {

            $this->incrementRateLimitCounter( $this->request->param( 'token' ), '/api/app/user/password_reset' );
            FlashMessage::set( 'passwordReset', $e->getMessage(), FlashMessage::ERROR );
            $this->response->redirect( Routes::appRoot() );

        }
    }

    public function resendEmailConfirm() {
        SignupModel::resendEmailConfirm( $this->request->param( 'email' ) );
        $this->response->code( 200 );
    }

    /**
     * Sends a password reset email to the provided email address.
     *
     * @return void
     * @throws ValidationError If the request fails the rate limit check or an error occurred during the password reset process.
     * @throws PredisException
     * @throws Exception
     */
    public function forgotPassword() {

        // first, validate email and wanted_url
        $this->validateForgotPasswordRequest(
            $this->request->param( 'email' ),
            $this->request->param( 'wanted_url' )
        );

        if($this->response->status()->getCode() == 400 ){
           return;
        }

        // then, add the request rate limit
        $checkRateLimitEmail = $this->checkRateLimitResponse( $this->response, $this->request->param( 'email' ), '/api/app/user/forgot_password', 5 );
        $checkRateLimitIp    = $this->checkRateLimitResponse( $this->response, Utils::getRealIpAddr(), '/api/app/user/forgot_password', 5 );

        if ( $checkRateLimitIp instanceof Response ) {
            $this->response = $checkRateLimitIp;

            return;
        }

        if ( $checkRateLimitEmail instanceof Response ) {
            $this->response = $checkRateLimitEmail;

            return;
        }

        $doForgotPassword = $this->doForgotPassword( $this->request->param( 'email' ), $this->request->param( 'wanted_url' ) );

        $this->incrementRateLimitCounter( $this->request->param( 'email' ), '/api/app/user/forgot_password' );

        $this->response->code( empty( $doForgotPassword ) ? 200 : 500 );
        $this->response->json( [
                'email'      => $this->request->param( 'email' ),
                'wanted_url' => $this->request->param( 'wanted_url' ),
                'errors'     => $doForgotPassword,
        ] );
    }

    /**
     * @param $email
     * @param $wanted_url
     */
    private function validateForgotPasswordRequest($email, $wanted_url) {
        if(empty($email)){
            $this->response->code( 400 );
            $this->response->json( [
                'error' => [
                    'message' => '`email` is a mandatary field.'
                ]
            ] );

            return;
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->response->code( 400 );
            $this->response->json( [
                'error' => [
                    'message' => 'The email address is not valid'
                ]
            ] );

            return;
        }

        if(empty($wanted_url)){
            $this->response->code( 400 );
            $this->response->json( [
                'error' => [
                    'message' => '`wanted_url` is a mandatary field.'
                ]
            ] );

            return;
        }

        if (!filter_var($wanted_url, FILTER_VALIDATE_URL)) {
            $this->response->code( 400 );
            $this->response->json( [
                'error' => [
                    'message' => 'The wanted_url is not a valid URL.'
                ]
            ] );

            return;
        }
    }

    /**
     * @param $email
     * @param $wanted_url
     * @return array
     */
    private function doForgotPassword($email, $wanted_url) {

        $errors = [];

        try {
            if ( !SignupModel::forgotPassword( $email, $wanted_url ) ) {
                Log::doJsonLog( 'Failed attempt to recover password with email ' . $email );
            }
        } catch ( Exception $exception ) {
            $errors[] = 'Error updating database.';
        }

        return $errors;
    }


    /**
     * @throws ValidationError
     */
    public function setNewPassword() {

        $reset                 = new PasswordResetModel( null, $_SESSION );
        $new_password          = filter_var( $this->request->param( 'password' ), FILTER_SANITIZE_STRING );
        $password_confirmation = filter_var( $this->request->param( 'password_confirmation' ), FILTER_SANITIZE_STRING );
        $reset->resetPassword( $new_password, $password_confirmation );

        $this->response->code( 200 );

    }

    private function __flushWantedURL() {
        $url = isset( $_SESSION[ 'wanted_url' ] ) ? $_SESSION[ 'wanted_url' ] : Routes::appRoot();
        unset( $_SESSION[ 'wanted_url' ] );

        return $url;
    }

}