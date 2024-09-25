import {useEffect, useRef} from 'react'
import PropTypes from 'prop-types'
import {
  getProjectTemplateDefault,
  getProjectTemplates,
} from '../api/getProjectTemplates/getProjectTemplates'
import useTemplates from './useTemplates'

export const isStandardTemplate = ({id} = {}) => id === 0

const STANDARD_TEMPLATE = {
  id: 0,
  name: 'Standard',
  is_default: true,
  uid: 1,
  id_team: 1,
  segmentation_rule: {
    name: 'General',
    id: 'standard',
  },
  mt: {
    id: 1,
    extra: {},
  },
  tm: [],
  payable_rate_template_id: null,
  qa_model_template_id: null,
  get_public_matches: true,
  pretranslate_100: true,
  pretranslate_101: true,
  created_at: 'Fri, 02 Feb 24 16:48:34 +0100',
  modified_at: 'Fri, 02 Feb 24 16:48:34 +0100',
  filtersTemplateId: null,
  XliffConfigTemplateId: null,
}

const CATTOOL_TEMPLATE = {
  id: 0,
  name: '',
}

export const SCHEMA_KEYS = {
  id: 'id',
  uid: 'uid',
  isDefault: 'is_default',
  createdAt: 'created_at',
  modifiedAt: 'modified_at',
  name: 'name',
  idTeam: 'id_team',
  segmentationRule: 'segmentation_rule',
  mt: 'mt',
  tm: 'tm',
  payableRateTemplateId: 'payable_rate_template_id',
  qaModelTemplateId: 'qa_model_template_id',
  getPublicMatches: 'get_public_matches',
  pretranslate100: 'pretranslate_100',
  pretranslate101: 'pretranslate_101',
  filtersTemplateId: 'filters_template_id',
  XliffConfigTemplateId: 'xliff_config_template_id',
}

function useProjectTemplates(tmKeys, isCattool = config.is_cattool) {
  const {
    templates: projectTemplates,
    setTemplates: setProjectTemplates,
    currentTemplate: currentProjectTemplate,
    modifyingCurrentTemplate,
    checkSpecificTemplatePropsAreModified,
  } = useTemplates(SCHEMA_KEYS)

  const tmKeysRef = useRef()
  tmKeysRef.current = tmKeys

  const canRetrieveTemplates = Array.isArray(tmKeys)

  // retrieve templates
  useEffect(() => {
    if (!canRetrieveTemplates) return

    let cleanup = false

    if (config.isLoggedIn === 1 && !config.is_cattool) {
      Promise.all([getProjectTemplateDefault(), getProjectTemplates()]).then(
        ([templateDefault, {items}]) => {
          if (!cleanup) {
            const shouldStandardToBeDefault = items.every(
              ({is_default}) => !is_default,
            )
            setProjectTemplates(
              [
                {
                  ...templateDefault,
                  ...(shouldStandardToBeDefault && {is_default: true}),
                },
                ...items,
              ].map((template) => ({
                ...template,
                tm: template.tm.map((item) => ({
                  ...item,
                  name:
                    tmKeysRef.current.find(({key}) => key === item.key)?.name ??
                    item.name,
                })),
                isSelected: template.is_default,
              })),
            )
          }
        },
      )
    } else {
      setProjectTemplates([{...STANDARD_TEMPLATE, isSelected: true}])
    }

    return () => (cleanup = true)
  }, [canRetrieveTemplates, setProjectTemplates])

  useEffect(() => {
    if (isCattool) {
      setProjectTemplates([{...CATTOOL_TEMPLATE, isSelected: true}])
    }
  }, [isCattool, setProjectTemplates])

  return {
    projectTemplates,
    currentProjectTemplate,
    setProjectTemplates,
    modifyingCurrentTemplate,
    checkSpecificTemplatePropsAreModified,
  }
}

useProjectTemplates.propTypes = {
  canRetrieveTemplates: PropTypes.bool,
}

export default useProjectTemplates
