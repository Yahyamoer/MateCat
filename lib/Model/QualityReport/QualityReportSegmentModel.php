<?php
/**
 * Created by PhpStorm.
 * User: vincenzoruffa
 * Date: 07/09/2018
 * Time: 11:21
 */

namespace QualityReport;

use CatUtils;
use Chunks_ChunkStruct;
use Comments_CommentDao;
use Constants;
use Constants_TranslationStatus;
use Features\ReviewExtended\Model\QualityReportDao;
use Features\ReviewExtended\ReviewUtils;
use Features\TranslationVersions;
use Features\TranslationVersions\Model\TranslationVersionDao;
use FeatureSet;
use LQA\CategoryDao;
use LQA\CategoryStruct;
use LQA\ChunkReviewDao;
use LQA\EntryCommentDao;
use Matecat\SubFiltering\MateCatFilter;
use QualityReport_QualityReportSegmentStruct;
use Segments_SegmentDao;
use Segments_SegmentOriginalDataDao;

class QualityReportSegmentModel {

    protected $chunk;

    protected $_chunkReviews;

    public function __construct( Chunks_ChunkStruct $chunk ) {
        $this->chunk = $chunk;
    }

    /**
     * @param int    $step
     * @param        $ref_segment
     * @param string $where
     * @param array  $options
     *
     * @return array
     * @throws \Exception
     */
    public function getSegmentsIdForQR( $step, $ref_segment, $where = "after", $options = [] ) {
        if ( isset( $options[ 'filter' ][ 'issue_category' ] ) && $options[ 'filter' ][ 'issue_category' ] != 'all' ) {
            $subCategories = ( new CategoryDao() )->findByIdModelAndIdParent(
                    $this->chunk->getProject()->id_qa_model,
                    $options[ 'filter' ][ 'issue_category' ]
            );

            if ( !empty( $subCategories ) > 0 ) {
                $options[ 'filter' ][ 'issue_category' ] = array_map( function ( CategoryStruct $subcat ) {
                    return $subcat->id;
                }, $subCategories );
            }
        }

        /**
         * Validate revision_number param
         */
        if ( !empty( $options[ 'filter' ] ) && in_array( $options[ 'filter' ] [ 'status' ], Constants_TranslationStatus::$REVISION_STATUSES ) ) {
            if ( isset( $options[ 'filter' ][ 'revision_number' ] ) ) {

                $validRevisionNumbers = array_map( function ( $chunkReview ) {
                    return ReviewUtils::sourcePageToRevisionNumber( $chunkReview->source_page );
                }, $this->_getChunkReviews() );

                if ( !in_array( (int)$options[ 'filter' ][ 'revision_number' ], $validRevisionNumbers ) ) {
                    $options[ 'filter' ][ 'revision_number' ] = 1;
                }
            }
        }

        $segmentsDao = new Segments_SegmentDao();
        $segments_id = $segmentsDao->getSegmentsIdForQR(
                $this->chunk, $step, $ref_segment, $where, $options
        );

        return $segments_id;
    }

    /**
     * @param QualityReport_QualityReportSegmentStruct $seg
     * @param MateCatFilter                            $Filter
     * @param FeatureSet                               $featureSet
     * @param Chunks_ChunkStruct                       $chunk
     * @param bool                                     $isForUI
     *
     * @throws \Exception
     */
    protected function _commonSegmentAssignments( QualityReport_QualityReportSegmentStruct $seg, MateCatFilter $Filter, FeatureSet $featureSet, Chunks_ChunkStruct $chunk, $isForUI = false ) {
        $seg->warnings            = $seg->getLocalWarning( $featureSet, $chunk );
        $seg->pee                 = $seg->getPEE();
        $seg->ice_modified        = $seg->isICEModified();
        $seg->secs_per_word       = $seg->getSecsPerWord();
        $seg->parsed_time_to_edit = CatUtils::parse_time_to_edit( $seg->time_to_edit );

        if ( $isForUI ) {
            $seg->segment     = $Filter->fromLayer0ToLayer2( $seg->segment );
            $seg->translation = $Filter->fromLayer0ToLayer2( $seg->translation );
            $seg->suggestion  = $Filter->fromLayer0ToLayer2( $seg->suggestion );
        }
    }

    /**
     * @param $seg
     * @param $issues
     * @param $issue_comments
     */
    protected function _assignIssues( $seg, $issues, $issue_comments ) {
        foreach ( $issues as $issue ) {

            $issue->revision_number = ReviewUtils::sourcePageToRevisionNumber( $issue->source_page );

            if ( isset( $issue_comments[ $issue->issue_id ] ) ) {
                $issue->comments = $issue_comments[ $issue->issue_id ];
            }

            if ( $issue->segment_id == $seg->sid ) {
                $seg->issues[] = $issue;
            }
        }
    }

    /**
     * @param $seg
     * @param $comments
     */
    protected function _assignComments( $seg, $comments ) {
        foreach ( $comments as $comment ) {
            $comment->templateMessage();
            if ( $comment->id_segment == $seg->sid ) {
                $seg->comments[] = $comment;
            }
        }
    }

    /**
     * If the results are needed from UI return a layer2 presentation,
     * otherwise return just plain text (layer 0)
     *
     * @param array $segment_ids
     * @param bool  $isForUI
     *
     * @return array
     * @throws \Exception
     */
    public function getSegmentsForQR( array $segment_ids, $isForUI = false ) {
        $segmentsDao = new Segments_SegmentDao;
        $data        = $segmentsDao->getSegmentsForQr( $segment_ids, $this->chunk->id, $this->chunk->password );

        $featureSet = new FeatureSet();

        $featureSet->loadForProject( $this->chunk->getProject() );
        $issue_comments = [];

        $issues = QualityReportDao::getIssuesBySegments( $segment_ids, $this->chunk->id );
        if ( !empty( $issues ) ) {
            $issue_comments = ( new EntryCommentDao() )->fetchCommentsGroupedByIssueIds(
                    array_map( function ( $issue ) {
                        return $issue->issue_id;
                    }, $issues )
            );
        }

        $commentsDao = new Comments_CommentDao;
        $comments    = $commentsDao->getThreadsBySegments( $segment_ids, $this->chunk->id );
        $codes       = $featureSet->getCodes();

        $last_revisions         = [];
        $last_flatten_revisions = [];

        $translationVersionDao = new TranslationVersionDao;
        $last_translations     = $translationVersionDao->getLastRevisionsBySegmentsAndSourcePage(
                $segment_ids, $this->chunk->id, Constants::SOURCE_PAGE_TRANSLATE
        );

        foreach ( $this->_getChunkReviews() as $chunkReview ) {
            $last_revisions [ $chunkReview->source_page ] = $revs = $translationVersionDao->getLastRevisionsBySegmentsAndSourcePage(
                    $segment_ids, $this->chunk->id, $chunkReview->source_page
            );
            $last_flatten_revisions                       = array_merge( $last_flatten_revisions, $revs );
        }
        $all_versions_flattened = array_merge( $last_translations, $last_flatten_revisions );

        $segments = [];

        foreach ( $data as $index => $seg ) {

            $dataRefMap = Segments_SegmentOriginalDataDao::getSegmentDataRefMap( $seg->sid );

            /** @var MateCatFilter $Filter */
            $Filter = MateCatFilter::getInstance( $featureSet, $this->chunk->source, $this->chunk->target, $dataRefMap );

            $seg->dataRefMap = $dataRefMap;

            $this->_commonSegmentAssignments( $seg, $Filter, $featureSet, $this->chunk, $isForUI );
            $this->_assignIssues( $seg, $issues ?? [], $issue_comments );
            $this->_assignComments( $seg, $comments );

            // If the segment is pre-translated (maybe from a previously XLIFF file) and NOT modified
            if (
                    $seg->getTmAnalysisStatus() == 'SKIPPED' &&
                    !$this->isSegmentIdInArray( $seg->sid, $all_versions_flattened )
            ) {
                $seg->last_revisions    = [];
                $seg->is_pre_translated = true;
                $seg->suggestion        = ( $isForUI ) ? $Filter->fromLayer0ToLayer2( $seg->suggestion ) : $seg->suggestion;
                switch ( $seg->status ) {
                    case Constants_TranslationStatus::STATUS_APPROVED:
                        $seg->last_revisions[] = [
                                'revision_number' => 1,
                                'translation'     => ( $isForUI ) ? $Filter->fromLayer0ToLayer2( $seg->translation ) : $seg->translation
                        ];
                        break;
                    case Constants_TranslationStatus::STATUS_APPROVED2:
                        $seg->last_revisions[] = [
                                'revision_number' => 2,
                                'translation'     => ( $isForUI ) ? $Filter->fromLayer0ToLayer2( $seg->translation ) : $seg->translation
                        ];
                        break;
                    case Constants_TranslationStatus::STATUS_TRANSLATED:
                        $seg->last_translation = ( $isForUI ) ? $Filter->fromLayer0ToLayer2( $seg->translation ) : $seg->translation;
                        break;
                    default:
                        $seg->is_pre_translated = false; // not reached condition
                        break;
                }
            } else {

                $this->_populateLastTranslationAndRevision( $seg, $Filter, $last_translations, $last_revisions, $codes, $isForUI );

            }

            $seg->pee_translation_revise     = $seg->getPEEBwtTranslationRevise();
            $seg->pee_translation_suggestion = $seg->getPEEBwtTranslationSuggestion();

            $segments[ $index ] = $seg;
        }

        return $segments;
    }

    /**
     * This function checks if a segment is an approved locked ICE without associated events
     * (in other terms is a pre-approved segment)
     *
     * @param QualityReport_QualityReportSegmentStruct $qrSegmentStruct
     *
     * @return bool
     */
    private function isAnApprovedIce( QualityReport_QualityReportSegmentStruct $qrSegmentStruct ) {
        return (
                $qrSegmentStruct->locked == 1 and
                ( $qrSegmentStruct->status === Constants_TranslationStatus::STATUS_APPROVED or $qrSegmentStruct->status === Constants_TranslationStatus::STATUS_APPROVED2 ) and
                $qrSegmentStruct->match_type === 'ICE'
        );
    }

    /**
     * @return \LQA\ChunkReviewStruct[]
     */
    protected function _getChunkReviews() {
        if ( is_null( $this->_chunkReviews ) ) {
            $this->_chunkReviews = ( new ChunkReviewDao() )->findChunkReviews( $this->chunk );
        }

        return $this->_chunkReviews;
    }

    /**
     * @param $last_translations
     * @param $seg
     * @param $Filter
     * @param $last_revisions
     * @param $codes
     * @param $isForUI
     *
     * @throws \Exception
     */
    protected function _populateLastTranslationAndRevision( $seg, MateCatFilter $Filter, $last_translations, $last_revisions, $codes, $isForUI = false ) {
        $last_translation = $this->_findLastTranslation( $seg, $Filter, $last_translations, $isForUI );

        // last revision version object
        $last_segment_revisions = $this->_findLastRevision( $seg, $Filter, $last_revisions, $isForUI );

        if (
                $seg->status == Constants_TranslationStatus::STATUS_TRANSLATED ||
                $seg->status == Constants_TranslationStatus::STATUS_APPROVED ||
                $seg->status == Constants_TranslationStatus::STATUS_APPROVED2
        ) {

            if ( !empty( $last_translation ) ) {
                $seg->last_translation = $last_translation->translation;
            }

            if ( !empty( $last_segment_revisions ) ) {
                $seg->last_revisions = [];
                foreach ( $last_segment_revisions as $source_page => $revision ) {
                    $seg->last_revisions[] = [
                            'revision_number' => ReviewUtils::sourcePageToRevisionNumber( $source_page ),
                            'translation'     => $revision->translation
                    ];
                }

            }
        }

    }

    /**
     * @param               $seg
     * @param MateCatFilter $Filter
     * @param               $last_translations
     * @param bool          $isForUI
     *
     * @return mixed|null
     * @throws \Exception
     */
    protected function _findLastTranslation( $seg, MateCatFilter $Filter, $last_translations, $isForUI = false ) {
        $find_last_translation_version = null;
        if ( !empty( $last_translations ) ) {
            foreach ( $last_translations as $last_translation ) {
                if ( $last_translation->id_segment == $seg->sid ) {
                    $translation                   = ( $isForUI ) ? $Filter->fromLayer0ToLayer2( $last_translation->translation ) : $last_translation->translation;
                    $last_translation->translation = $translation;
                    $find_last_translation_version = $last_translation;
                    break;
                }
            }
        }

        return $find_last_translation_version;
    }

    /**
     * @param               $seg
     * @param MateCatFilter $Filter
     * @param               $last_revisions
     * @param               $isForUI
     *
     * @return null
     * @throws \Exception
     */
    protected function _findLastRevision( $seg, MateCatFilter $Filter, $last_revisions, $isForUI = false ) {
        $segment_last_revisions = [];

        if ( !empty( $last_revisions ) ) {
            foreach ( $last_revisions as $source_page => $source_page_revisions ) {
                foreach ( $source_page_revisions as $last_revision ) {
                    if ( $last_revision->id_segment == $seg->sid ) {
                        $last_translation                       = ( $isForUI ) ? $Filter->fromLayer0ToLayer2( $last_revision->translation ) : $last_revision->translation;
                        $last_revision->translation             = $last_translation;
                        $segment_last_revisions[ $source_page ] = $last_revision;
                        break;
                    }
                }
            }
        }

        return $segment_last_revisions;
    }

    /**
     * @param array $revisions
     * @param int   $current_id
     *
     * @return bool
     */
    protected function isSegmentIdInArray( int $current_id, array $revisions ): bool {
        foreach ( $revisions as $revSegment ) {
            if ( $revSegment->id_segment == $current_id ) {
                return true;
            }
        }

        return false;
    }

}
