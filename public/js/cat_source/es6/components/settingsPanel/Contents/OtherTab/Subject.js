import React, {useContext, useMemo} from 'react'
import {Select} from '../../../common/Select'
import {CreateProjectContext} from '../../../createProject/CreateProjectContext'

export const Subject = () => {
  const {SELECT_HEIGHT} = useContext(CreateProjectContext)
  const {subject, setSubject} = useContext(CreateProjectContext)

  const subjectsArray = useMemo(
    () =>
      config.subject_array.map((item) => {
        return {...item, id: item.key, name: item.display}
      }),
    [],
  )

  return (
    <div className="options-box">
      <div className="option-description">
        <h3>Subject</h3>Select your project's subject
      </div>
      <div className="options-select-container">
        <Select
          id="project-subject"
          name={'project-subject'}
          maxHeightDroplist={SELECT_HEIGHT}
          showSearchBar={true}
          options={subjectsArray}
          activeOption={subject}
          checkSpaceToReverse={false}
          onSelect={(option) => setSubject(option)}
        />
      </div>
    </div>
  )
}
