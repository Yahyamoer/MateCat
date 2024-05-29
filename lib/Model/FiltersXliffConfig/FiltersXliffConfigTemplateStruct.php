<?php

namespace FiltersXliffConfig;

use DataAccess_AbstractDaoSilentStruct;
use Date\DateTimeUtil;
use Exception;
use FiltersXliffConfig\Filters\DTO\Json;
use FiltersXliffConfig\Filters\DTO\MSExcel;
use FiltersXliffConfig\Filters\DTO\Xml;
use FiltersXliffConfig\Filters\DTO\Yaml;
use FiltersXliffConfig\Filters\FiltersConfigModel;
use FiltersXliffConfig\Xliff\DTO\Xliff12Rule;
use FiltersXliffConfig\Xliff\DTO\Xliff20Rule;
use FiltersXliffConfig\Xliff\XliffConfigModel;
use JsonSerializable;

class FiltersXliffConfigTemplateStruct extends DataAccess_AbstractDaoSilentStruct implements JsonSerializable
{
    public $id;
    public $name;
    public $uid;
    public $created_at;
    public $modified_at;
    public $deleted_at;

    /**
     * @var XliffConfigModel
     */
    private $xliff = null;

    /**
     * @var FiltersConfigModel
     */
    private $filters = null;

    /**
     * @param XliffConfigModel $xliff
     */
    public function setXliff(XliffConfigModel $xliff): void
    {
        $this->xliff = $xliff;
    }

    /**
     * @return XliffConfigModel
     */
    public function getXliff()
    {
        return $this->xliff;
    }

    /**
     * @return FiltersConfigModel
     */
    public function getFilters()
    {
        return $this->filters;
    }

    /**
     * @param FiltersConfigModel $filters
     */
    public function setFilters(FiltersConfigModel $filters): void
    {
        $this->filters = $filters;
    }

    /**
     * @param string $json
     * @return $this
     *
     * @throws Exception
     */
    public function hydrateFromJSON($json)
    {
        $json = json_decode($json, true);

        if(
            !isset($json['uid']) and
            !isset($json['name']) and
            !isset($json['filters']) and
            !isset($json['xliff'])
        ){
            throw new Exception("Cannot instantiate a new FiltersXliffConfigTemplateStruct. Invalid data provided.", 403);
        }

        $this->uid = $json['uid'];
        $this->name = $json['name'];
        $xliff = (!is_array($json['xliff'])) ? json_decode($json['xliff'], true) : $json['xliff'];
        $filters = (!is_array($json['filters'])) ? json_decode($json['filters'], true) : $json['filters'];

        if(isset($json['id'])){ $this->id = $json['id']; }
        if(isset($json['created_at'])){ $this->created_at = $json['created_at']; }
        if(isset($json['deleted_at'])){ $this->deleted_at = $json['deleted_at']; }
        if(isset($json['modified_at'])){ $this->modified_at = $json['modified_at']; }

        $filtersConfig = new FiltersConfigModel();
        $xliffConfig = new XliffConfigModel();

        // xliff
        if(!empty($xliff)){

            // xliff12
            if(isset($xliff['xliff12']) and is_array($xliff['xliff12'])){
                foreach ($xliff['xliff12'] as $xliff12Rule){
                    $rule = new Xliff12Rule($xliff12Rule['state'], $xliff12Rule['analysis'], $xliff12Rule['editor']);
                    $xliffConfig->addRule($rule);
                }
            }

            // xliff20
            if(isset($xliff['xliff20']) and is_array($xliff['xliff20'])){
                foreach ($xliff['xliff20'] as $xliff20Rule){
                    $rule = new Xliff20Rule($xliff20Rule['state'], $xliff20Rule['analysis'], $xliff20Rule['editor']);
                    $xliffConfig->addRule($rule);
                }
            }
        }

        // filters
        if(!empty($filters)){

            // json
            if(isset($filters['json'])){
                $jsonDto = new Json();

                if(isset($filters['json']['extract_arrays'])){
                    $jsonDto->setExtractArrays($filters['json']['extract_arrays']);
                }

                if(isset($filters['json']['escape_forward_slashes'])){
                    $jsonDto->setEscapeForwardSlashes($filters['json']['escape_forward_slashes']);
                }

                if(isset($filters['json']['translate_keys'])){
                    $jsonDto->setTranslateKeys($filters['json']['translate_keys']);
                }

                if(isset($filters['json']['do_not_translate_keys'])){
                    $jsonDto->setDoNotTranslateKeys($filters['json']['do_not_translate_keys']);
                }

                if(isset($filters['json']['context_keys'])){
                    $jsonDto->setContextKeys($filters['json']['context_keys']);
                }

                $filtersConfig->setJson($jsonDto);
            }

            // xml
            if(isset($filters['xml'])){
                $xmlDao = new Xml();

                if(isset($filters['xml']['preserve_whitespace'])){
                    $xmlDao->setPreserveWhitespace($filters['xml']['preserve_whitespace']);
                }

                if(isset($filters['xml']['translate_elements'])){
                    $xmlDao->setTranslateElements($filters['xml']['translate_elements']);
                }

                if(isset($filters['xml']['do_not_translate_elements'])){
                    $xmlDao->setDoNotTranslateElements($filters['xml']['do_not_translate_elements']);
                }

                if(isset($filters['xml']['include_attributes'])){
                    $xmlDao->setIncludeAttributes($filters['xml']['include_attributes']);
                }

                $filtersConfig->setXml($xmlDao);
            }

            // yaml
            if(isset($filters['yaml'])){
                $yamlDao = new Yaml();

                if(isset($filters['yaml']['extract_arrays'])){
                    $yamlDao->setExtractArrays($filters['yaml']['extract_arrays']);
                }

                if(isset($filters['yaml']['translate_keys'])){
                    $yamlDao->setTranslateKeys($filters['yaml']['translate_keys']);
                }

                if(isset($filters['yaml']['do_not_translate_keys'])){
                    $yamlDao->setDoNotTranslateKeys($filters['yaml']['do_not_translate_keys']);
                }

                $filtersConfig->setYaml($yamlDao);
            }

            // ms excel
            if(isset($filters['ms_excel'])){
                $excelDao = new MSExcel();

                if(isset($filters['yaml']['exclude_columns'])){
                    $excelDao->setExcludeColumns($filters['yaml']['exclude_columns']);
                }

                if(isset($filters['yaml']['extract_diagrams'])){
                    $excelDao->setExtractDiagrams($filters['yaml']['extract_diagrams']);
                }

                if(isset($filters['yaml']['extract_comments'])){
                    $excelDao->setExtractComments($filters['yaml']['extract_comments']);
                }

                if(isset($filters['yaml']['extract_drawings'])){
                    $excelDao->setExtractDrawings($filters['yaml']['extract_drawings']);
                }

                if(isset($filters['yaml']['extract_hidden_cells'])){
                    $excelDao->setExtractHiddenCells($filters['yaml']['extract_hidden_cells']);
                }

                if(isset($filters['yaml']['exclude_text_colors'])){
                    $excelDao->setExcludeTextColors($filters['yaml']['exclude_text_colors']);
                }

                if(isset($filters['yaml']['extract_doc_properties'])){
                    $excelDao->setExtractDocProperties($filters['yaml']['extract_doc_properties']);
                }

                if(isset($filters['yaml']['extract_sheet_names'])){
                    $excelDao->setExtractSheetNames($filters['yaml']['extract_sheet_names']);
                }

                $filtersConfig->setMsExcel($excelDao);
            }

            // ms word
            if(isset($filters['ms_word'])){

            }

            // ms powerpoint
            if(isset($filters['ms_powerpoint'])){

            }
        }

        $this->setFilters($filtersConfig);
        $this->setXliff($xliffConfig);

        return $this;
    }

    /**
     * @inheritDoc
     * @throws \Exception
     */
    public function jsonSerialize()
    {
        return [
            'id' => (int)$this->id,
            'uid' => (int)$this->uid,
            'name' => $this->name,
            'filters' => ($this->filters !== null) ? $this->filters : new \stdClass(),
            'xliff' => ($this->xliff !== null) ? $this->xliff : new \stdClass(),
            'createdAt' => DateTimeUtil::formatIsoDate($this->created_at),
            'modifiedAt' => DateTimeUtil::formatIsoDate($this->modified_at),
            'deletedAt' => DateTimeUtil::formatIsoDate($this->deleted_at),
        ];
    }
}