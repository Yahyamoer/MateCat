import React, {useContext, useEffect, useRef, useState} from 'react'
import PropTypes from 'prop-types'
import {QualityFrameworkTabContext} from './QualityFrameworkTab'
import {isEqual} from 'lodash'

export const SeveritiyRow = ({severity}) => {
  const {modifyingCurrentTemplate, templates, currentTemplate} = useContext(
    QualityFrameworkTabContext,
  )

  const ref = useRef()

  const [penalty, setPenalty] = useState(severity.penalty)

  useEffect(() => {
    setPenalty(
      typeof severity.penalty === 'number'
        ? Number(severity.penalty)
        : severity.penalty,
    )
  }, [severity.penalty])

  const onChange = ({currentTarget: {value}}) => {
    const isValidInput = typeof value === 'number' || !/[^+0-9.]/g.test(value)
    if (isValidInput) {
      setPenalty(value)
    }
  }
  const selectAll = () => ref.current.select()
  const onBlur = () => {
    const {id, id_category: idCategory} = severity
    modifyingCurrentTemplate((prevTemplate) => {
      const {categories} = prevTemplate

      return {
        ...prevTemplate,
        categories: categories.map((category) => ({
          ...category,
          severities: category.severities.map((severityItem) => {
            if (idCategory === category.id && id === severityItem.id) {
              return {
                ...severityItem,
                penalty:
                  penalty !== '' ? parseFloat(penalty) : severityItem.penalty,
              }
            } else {
              return severityItem
            }
          }),
        })),
      }
    })

    if (penalty === '') setPenalty(severity.penalty)
  }

  const checkIsNotSaved = () => {
    if (!templates?.some(({isTemporary}) => isTemporary)) return false

    const originalCurrentTemplate = templates?.find(
      ({id, isTemporary}) => id === currentTemplate.id && !isTemporary,
    )

    const isMatched = originalCurrentTemplate.categories.some(({severities}) =>
      severities.some(({id}) => id === severity.id),
    )

    if (!isMatched) return true

    const categoryIndex = originalCurrentTemplate.categories.findIndex(
      ({id}) => id === severity.id_category,
    )
    const severityIndex = originalCurrentTemplate.categories[
      categoryIndex
    ].severities.findIndex(
      ({id, id_category}) =>
        id_category === severity.id_category && id === severity.id,
    )

    const isModified = !isEqual(
      originalCurrentTemplate.categories[categoryIndex].severities[
        severityIndex
      ],
      currentTemplate.categories[categoryIndex].severities[severityIndex],
    )

    return isModified
  }

  const isNotSaved = checkIsNotSaved()

  return (
    <div className={`cell${isNotSaved ? ' cell-not-saved' : ''}`}>
      <input
        ref={ref}
        className="quality-framework-input"
        type="text"
        value={penalty}
        onChange={onChange}
        onFocus={selectAll}
        onBlur={onBlur}
      />
    </div>
  )
}

SeveritiyRow.propTypes = {
  severity: PropTypes.object,
}
