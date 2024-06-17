<?php

namespace FiltersXliffConfig\Xliff\DTO;

use DomainException;
use JsonSerializable;
use RecursiveArrayObject;

class XliffConfigModel implements JsonSerializable {

    const XLIFF_12 = 'xliff12';
    const XLIFF_20 = 'xliff20';

    /**
     * @var array
     */
    private $ruleSets = [
            self::XLIFF_12 => [],
            self::XLIFF_20 => [],
    ];

    /**
     * @param XliffRuleInterface $rule
     */
    public function addRule( XliffRuleInterface $rule ) {
        if ( $rule instanceof Xliff20Rule ) {
            $this->validateDuplicatedStates( $rule, self::XLIFF_20 );
            $this->ruleSets[ self::XLIFF_20 ][] = $rule;
        } elseif ( $rule instanceof Xliff12Rule ) {
            $this->validateDuplicatedStates( $rule, self::XLIFF_12 );
            $this->ruleSets[ self::XLIFF_12 ][] = $rule;
        }
    }

    /**
     * @param XliffRuleInterface $rule
     * @param string             $type
     *
     * @return void
     */
    public function validateDuplicatedStates( XliffRuleInterface $rule, $type ) {
        foreach ( $this->ruleSets[ $type ] as $existentRule ) {
            $stateIntersect = array_intersect( $existentRule->getStates(), $rule->getStates() );
            if ( !empty( $stateIntersect ) ) {
                throw new DomainException( "The same state/state-qualifier cannot be used in two different rules: " . implode( ", ", $stateIntersect ), 400 );
            }
        }
    }

    /**
     * @param RecursiveArrayObject $structure
     *
     * @return static
     */
    public static function fromArrayObject( RecursiveArrayobject $structure ) {
        $self = new static();
        foreach ( $structure as $ruleType => $ruleSet ) {

            if ( $ruleType == self::XLIFF_12 ) {
                $ruleClass = Xliff12Rule::class;
            } elseif ( $ruleType == self::XLIFF_20 ) {
                $ruleClass = Xliff20Rule::class;
            } else {
                throw new DomainException( "Invalid Rule: " . $ruleType, 400 );
            }

            foreach ( $ruleSet as $rule ) {
                $self->addRule( $ruleClass::fromArrayObject( $rule ) );
            }

        }

        return $self;
    }

    /**
     * @param $versionNumber
     *
     * @return XliffRuleInterface[]
     */
    public function getRulesForVersion( $versionNumber ) {
        if ( $versionNumber == 1 ) {
            return $this->ruleSets[ static::XLIFF_12 ];
        } elseif ( $versionNumber == 2 ) {
            return $this->ruleSets[ static::XLIFF_20 ];
        } else {
            throw new DomainException( "Invalid Version: " . $versionNumber, 400 );
        }
    }

    /**
     * @param int    $versionNumber
     * @param string $state
     * @param string $stateQualifier
     *
     * @return XliffRuleInterface
     */
    public function getMatchingRule( $versionNumber, $state, $stateQualifier ) {

        // here we must analyze and check only for editor status
        foreach ( $this->getRulesForVersion( $versionNumber ) as $rule ) {

            if ( $stateQualifier !== null && in_array( strtolower( $stateQualifier ), $rule->getStates( 'state-qualifiers' ) ) ) {
                return $rule;
            }

            if ( $state !== null && in_array( strtolower( $state ), $rule->getStates( 'states' ) ) ) {
                return $rule;
            }

        }

        return new DefaultRule( array_filter( [ $state, $stateQualifier ] ), AbstractXliffRule::_ANALYSIS_PRE_TRANSLATED, null, null );

    }

    /**
     * @inheritDoc
     */
    public
    function jsonSerialize() {
        return $this->ruleSets;
    }

    /**
     * @inheritDoc
     */
    public function __toString() {
        return json_encode( $this->ruleSets );
    }
}
