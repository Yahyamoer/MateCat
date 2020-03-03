<?php
/**
 * Created by PhpStorm.
 * User: vincenzoruffa
 * Date: 11/09/2018
 * Time: 18:00
 */

$klein->with( '/api/v3/jobs/[:id_job]/[:password]', function () {
    route( '', 'GET', '\API\V3\ChunkController', 'show' ); //this do not show some info like teams and translators
    route( '/quality-report/segments', 'GET', 'Features\ReviewExtended\Controller\API\QualityReportController', 'segments' );
    route( '/files', 'GET', '\API\V3\FileInfoController', 'getInfo' );
} );

route( '/api/v3/word-count/raw', 'POST', '\API\V3\CountWordController', 'rawWords' );
route( '/api/v3/jobs/[:id_job]/[:password]/[:source_page]/issue-report/segments', 'GET', '\API\V3\IssueCheckController', 'segments' );