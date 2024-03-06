import React, {useContext, useState} from 'react'
import {
  POPOVER_ALIGN,
  POPOVER_VERTICAL_ALIGN,
  Popover,
} from '../../../common/Popover/Popover'
import {
  BUTTON_MODE,
  BUTTON_SIZE,
  BUTTON_TYPE,
  Button,
} from '../../../common/Button/Button'
import {QualityFrameworkTabContext} from './QualityFrameworkTab'
import IconAdd from '../../../icons/IconAdd'
import Checkmark from '../../../../../../../img/icons/Checkmark'

const getCategoryCode = (label) => label.substring(0, 3).toUpperCase()

export const AddCategory = () => {
  const {modifyingCurrentTemplate, currentTemplate} = useContext(
    QualityFrameworkTabContext,
  )

  const [isVisibleDescriptionInput, setIsVisibleDescriptionInput] =
    useState(false)
  const [params, setParams] = useState({name: '', description: ''})

  const {name, description} = params
  const setName = ({currentTarget: {value}}) =>
    setParams((prevState) => ({...prevState, name: value}))
  const setDescription = ({currentTarget: {value}}) =>
    setParams((prevState) => ({...prevState, description: value}))

  const addCategory = () => {
    const {categories = []} = currentTemplate ?? {}

    const lastCategory = categories.slice(-1)[0]
    const {id: lastCategoryId, severities: lastCategorySeverities} =
      lastCategory
    let lastSeverityId = lastCategory.severities.slice(-1)[0].id
    const newCategoryId = lastCategoryId + 1

    modifyingCurrentTemplate((prevTemplate) => ({
      ...prevTemplate,
      categories: [
        ...prevTemplate.categories,
        {
          ...lastCategory,
          id: newCategoryId,
          label: `${name}${description ? '(' + description + ')' : ''}`,
          code: getCategoryCode(name),
          severities: lastCategorySeverities.map((severity) => ({
            ...severity,
            id: ++lastSeverityId,
            id_category: newCategoryId,
            penalty: 0,
          })),
        },
      ],
    }))
  }

  const onClose = () => {
    setIsVisibleDescriptionInput(false)
    setParams({name: '', description: ''})
  }

  return (
    <div className="quality-framework-add-category">
      <Popover
        title="Add category"
        toggleButtonProps={{
          type: BUTTON_TYPE.PRIMARY,
          mode: BUTTON_MODE.BASIC,
          size: BUTTON_SIZE.MEDIUM,
          children: (
            <>
              <IconAdd size={22} /> Add category
            </>
          ),
        }}
        confirmButtonProps={{
          type: BUTTON_TYPE.PRIMARY,
          size: BUTTON_SIZE.MEDIUM,
          disabled: !name,
          children: (
            <>
              <Checkmark size={14} />
              Confirm
            </>
          ),
          onClick: addCategory,
        }}
        cancelButtonProps={{
          mode: BUTTON_MODE.OUTLINE,
          size: BUTTON_SIZE.MEDIUM,
          children: 'Cancel',
        }}
        align={POPOVER_ALIGN.RIGHT}
        verticalAlign={POPOVER_VERTICAL_ALIGN.TOP}
        onClose={onClose}
      >
        <div className="add-popover-content">
          <input
            className="quality-framework-input input"
            placeholder="Name"
            value={name}
            onChange={setName}
          />
          {!isVisibleDescriptionInput ? (
            <Button
              className="add-description"
              mode={BUTTON_MODE.GHOST}
              size={BUTTON_SIZE.SMALL}
              onClick={() => setIsVisibleDescriptionInput(true)}
            >
              <IconAdd size={20} /> Add description
            </Button>
          ) : (
            <input
              className="quality-framework-input input"
              placeholder="Description"
              value={description}
              onChange={setDescription}
            />
          )}
        </div>
      </Popover>
    </div>
  )
}
