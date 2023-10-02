<?php

class Constants_XliffTranslationStatus {

    const NEW_STATE = 'new';
    const INITIAL = 'initial';
    const NEEDS_TRANSLATION = 'needs-translation';
    const NEEDS_L10N = 'needs-l10n';
    const NEEDS_ADAPTATION = 'needs-adaptation';

    const TRANSLATED = 'translated';
    const NEEDS_REVIEW_ADAPTATION = 'needs-review-adaptation';
    const NEEDS_REVIEW_L10N = 'needs-review-l10n';
    const NEEDS_REVIEW_TRANSLATION = 'needs-review-translation';

    const REVIEWED = 'reviewed';
    const SIGNED_OFF = 'signed-off';

    const FINAL_STATE = 'final';

    /**
     * @param $status
     * @return bool
     */
    public static function isNew( $status ) {
        return in_array($status, [
            self::NEW_STATE,
            self::INITIAL,
            self::NEEDS_TRANSLATION,
            self::NEEDS_L10N,
            self::NEEDS_ADAPTATION,
        ]);
    }

    /**
     * @param $status
     * @return bool
     */
    public static function isTranslated( $status ) {
        return in_array($status, [
            self::TRANSLATED,
            self::NEEDS_REVIEW_ADAPTATION,
            self::NEEDS_REVIEW_L10N,
            self::NEEDS_REVIEW_TRANSLATION,
        ]);
    }

    /**
     * @param $status
     * @return bool
     */
    public static function isRevision( $status ) {
        return self::isR1($status) or self::isR2($status);
    }

    /**
     * @param $status
     * @return bool
     */
    public static function isR1( $status ) {
        return in_array($status, [
            self::REVIEWED,
            self::SIGNED_OFF,
        ]);
    }

    /**
     * @param $status
     * @return bool
     */
    public static function isR2( $status ) {
        return $status === self::FINAL_STATE;
    }
}