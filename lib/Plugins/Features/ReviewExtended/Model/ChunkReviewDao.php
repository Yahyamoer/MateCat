<?php
/**
 * Created by PhpStorm.
 * User: vincenzoruffa
 * Date: 24/09/2018
 * Time: 12:33
 */

namespace Features\ReviewExtended\Model;

use Chunks_ChunkStruct;
use Constants;
use Database;
use Exception;
use Features\ReviewExtended\ReviewUtils;
use LQA\ChunkReviewStruct;

class ChunkReviewDao extends \LQA\ChunkReviewDao {

    /**
     * @param Chunks_ChunkStruct $chunk
     *
     * @param null               $source_page
     *
     * @return int
     */
    public static function getPenaltyPointsForChunk( Chunks_ChunkStruct $chunk, $source_page = null ) {
        if ( is_null( $source_page ) ) {
            $source_page = Constants::SOURCE_PAGE_REVISION;
        }

        $sql = "SELECT SUM(penalty_points) FROM qa_entries e
                JOIN jobs j on j.id = e.id_job
                    AND e.id_segment >= j.job_first_segment
                    AND e.id_segment <= j.job_last_segment
                WHERE j.id = :id_job
                    AND j.password = :password
                    AND source_page = :source_page
                    AND e.deleted_at IS NULL
        ";

        $conn = Database::obtain()->getConnection();
        $stmt = $conn->prepare( $sql );
        $stmt->execute( [
            'id_job'      => $chunk->id,
            'password'    => $chunk->password,
            'source_page' => $source_page
        ] );

        $count = $stmt->fetch();

        $penalty_points = $count[ 0 ] == null ? 0 : $count[ 0 ];

        return $penalty_points;
    }

    public function countTimeToEdit( Chunks_ChunkStruct $chunk, $source_page ) {
        $sql = "
            SELECT SUM( time_to_edit ) FROM jobs
                JOIN segment_translation_events ste
                  ON jobs.id = ste.id_job
                  AND ste.id_segment >= jobs.job_first_segment AND ste.id_segment <= jobs.job_last_segment

                WHERE jobs.id = :id_job AND jobs.password = :password
                  AND ste.source_page = :source_page

                  GROUP BY ste.source_page

        ";

        $conn = Database::obtain()->getConnection();
        $stmt = $conn->prepare( $sql );
        $stmt->execute( [
            'id_job'      => $chunk->id,
            'password'    => $chunk->password,
            'source_page' => $source_page,
        ] );

        $result = $stmt->fetch();

        return ( !$result || $result[ 0 ] == null ) ? 0 : $result[ 0 ];
    }

    /**
     *
     * @param int   $chunkReviewID
     * @param array $data
     *
     * @throws Exception
     */
    public function passFailCountsAtomicUpdate( $chunkReviewID, $data = [] ) {

        /**
         * @var $chunkReview_partial ChunkReviewStruct
         */
        $chunkReview_partial = $data[ 'chunkReview_partials' ];
        $data[ 'force_pass_at' ]        = ReviewUtils::filterLQAModelLimit( $chunkReview_partial->getChunk()->getProject()->getLqaModel(), $chunkReview_partial->source_page );

        // in MySQL a sum of a null value to an integer returns 0
        // in MySQL division by zero returns NULL, so we have to coalesce null values from is_pass division
        $sql = "INSERT INTO 
            qa_chunk_reviews ( id, id_job, password, penalty_points, reviewed_words_count, total_tte ) 
        VALUES( 
            :id,
            :id_job,
            :password,
            :penalty_points,
            :reviewed_words_count,
            :total_tte
        ) ON DUPLICATE KEY UPDATE
        penalty_points = GREATEST( COALESCE( penalty_points, 0 ) + COALESCE( VALUES( penalty_points ), 0 ), 0 ),
        reviewed_words_count = GREATEST( reviewed_words_count + VALUES( reviewed_words_count ), 0 ),
        total_tte = GREATEST( total_tte + VALUES( total_tte ), 0 ),        
        is_pass = IF( 
				COALESCE(
					( GREATEST( COALESCE( penalty_points, 0 ) + COALESCE( VALUES( penalty_points ), 0 ), 0 ) ) 
					/ GREATEST( reviewed_words_count + VALUES( reviewed_words_count ), 0 ) * 1000 
					, 0
				) <= {$data[ 'force_pass_at' ]}, 1, 0
		);";

        $conn = Database::obtain()->getConnection();
        $stmt = $conn->prepare( $sql );
        $stmt->execute( [
            'id'                   => $chunkReviewID,
            'id_job'               => $chunkReview_partial->id_job,
            'password'             => $chunkReview_partial->password,
            'penalty_points'       => empty( $data[ 'penalty_points' ] ) ? 0 : $data[ 'penalty_points' ],
            'reviewed_words_count' => $data[ 'reviewed_words_count' ],
            'total_tte'            => $data[ 'total_tte' ],
        ] );

    }

}
