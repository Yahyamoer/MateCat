import React, {useState} from 'react'
import {Accordion} from '../../../common/Accordion/Accordion'

const ACCORDION_GROUP = {
  json: 'Json',
  xml: 'XML',
  yaml: 'YAML',
  msWord: 'MS Word',
  msExcel: 'MS Excel',
  msPowerpoint: 'MS Powerpoint',
}

export const AccordionGroupFiltersParams = () => {
  const [currentSection, setCurrentSection] = useState(
    Object.keys(ACCORDION_GROUP)[0],
  )

  const handleAccordion = (id) => setCurrentSection(id)

  return (
    <div className="filters-params-accordion-group">
      {Object.entries(ACCORDION_GROUP).map(([id, section]) => (
        <Accordion
          key={id}
          id={id}
          title={section}
          expanded={currentSection === id}
          onShow={handleAccordion}
          className="filters-params-accordion"
        >
          <span>we</span>
        </Accordion>
      ))}
    </div>
  )
}
