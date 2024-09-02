<?php

use TestHelpers\AbstractTest;


/**
 * @group  regression
 * @covers DataAccess_AbstractDao::setCacheTTL
 * User: dinies
 * Date: 18/04/16
 * Time: 15.08
 */
class SetCacheTTLTest extends AbstractTest {
    protected $reflector;
    protected $cache_TTL;

    public function setUp(): void {
        parent::setUp();
        $this->jobDao    = new EnginesModel_EngineDAO( Database::obtain( INIT::$DB_SERVER, INIT::$DB_USER, INIT::$DB_PASS, INIT::$DB_DATABASE ) );
        $this->reflector = new ReflectionClass( $this->jobDao );
        $this->cache_TTL = $this->reflector->getProperty( "cacheTTL" );
        $this->cache_TTL->setAccessible( true );

    }

    /**
     * It sets the cache TTL to 55.
     * @group  regression
     * @covers DataAccess_AbstractDao::setCacheTTL
     */
    public function test_setCacheTTL_to_value_not_zero() {
        $previous_TTL_value = $this->cache_TTL->getValue( $this->jobDao );
        $this->jobDao->setCacheTTL( 55 );
        $this->assertEquals( 55, $this->cache_TTL->getValue( $this->jobDao ) );
        $this->cache_TTL->setValue( $this->jobDao, $previous_TTL_value );
    }
}

