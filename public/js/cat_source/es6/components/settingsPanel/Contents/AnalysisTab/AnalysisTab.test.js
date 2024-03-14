import React from 'react'
import {
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react'
import {SettingsPanelContext} from '../../SettingsPanelContext'
import {
  ANALYSIS_BREAKDOWNS,
  ANALYSIS_SCHEMA_KEYS,
  AnalysisTab,
} from './AnalysisTab'
import projectTemplatesMock from '../../../../../../../mocks/projectTemplateMock'
import {mswServer} from '../../../../../../../mocks/mswServer'
import {http, HttpResponse} from 'msw'
import payableRateTemplateMock from '../../../../../../../mocks/payableRateTemplateMock'
import useTemplates from '../../../../hooks/useTemplates'
import languagesMock from '../../../../../../../mocks/languagesMock'
import {CreateProjectContext} from '../../../createProject/CreateProjectContext'

beforeEach(() => {
  global.config = {
    basepath: 'http://localhost/',
    enableMultiDomainApi: false,
    ajaxDomainsNumber: 20,
    isLoggedIn: 1,
    is_cattool: false,
  }

  mswServer.use(
    http.get(`${config.basepath}api/v2/payable_rate`, () => {
      return HttpResponse.json(payableRateTemplateMock)
    }),
  )
})

test('Render Analysis Tab', async () => {
  const {result} = renderHook(() => useTemplates(ANALYSIS_SCHEMA_KEYS))
  let values = {
    openLoginModal: jest.fn(),
    modifyingCurrentTemplate: jest.fn(),
    currentProjectTemplate: projectTemplatesMock.items[0],
    projectTemplates: projectTemplatesMock.items,
    analysisTemplates: result.current,
  }
  const {rerender} = render(
    <SettingsPanelContext.Provider value={values}>
      <AnalysisTab />
    </SettingsPanelContext.Provider>,
  )
  await waitFor(() => expect(result.current.templates.length).not.toBe(0))
  values.analysisTemplates = result.current
  values.analysisTemplates.modifyingCurrentTemplate = jest.fn()
  rerender(
    <SettingsPanelContext.Provider value={values}>
      <AnalysisTab />
    </SettingsPanelContext.Provider>,
  )
  const currentAnalysisTemplate = result.current.templates?.find(
    ({id, isTemporary}) =>
      id === result.current.currentTemplate.id && !isTemporary,
  )
  expect(screen.getByText('Repetitions')).toBeInTheDocument()

  for (const [key, value] of Object.entries(ANALYSIS_BREAKDOWNS)) {
    if (value !== '100%_PUBLIC' && value !== 'ICE') {
      const valuePerc = currentAnalysisTemplate.breakdowns.default[value] + '%'
      expect(screen.queryByTestId(ANALYSIS_BREAKDOWNS[key]).value).toBe(
        valuePerc,
      )
    }
  }
  const mtValue = screen.getByTestId(ANALYSIS_BREAKDOWNS.mt)
  fireEvent.change(mtValue, {target: {value: 100}})
  expect(screen.queryByTestId(ANALYSIS_BREAKDOWNS.mt).value).toBe('100')
  fireEvent.blur(mtValue)
  expect(values.analysisTemplates.modifyingCurrentTemplate).toBeCalledTimes(1)
})

test('Modify template breakdowns', async () => {
  const {result} = renderHook(() => useTemplates(ANALYSIS_SCHEMA_KEYS))
  let values = {
    openLoginModal: jest.fn(),
    modifyingCurrentTemplate: jest.fn(),
    currentProjectTemplate: projectTemplatesMock.items[0],
    projectTemplates: projectTemplatesMock.items,
    analysisTemplates: result.current,
  }
  const {rerender} = render(
    <SettingsPanelContext.Provider value={values}>
      <AnalysisTab />
    </SettingsPanelContext.Provider>,
  )
  await waitFor(() => expect(result.current.templates.length).not.toBe(0))
  values.analysisTemplates = result.current
  values.analysisTemplates.modifyingCurrentTemplate = jest.fn()
  rerender(
    <SettingsPanelContext.Provider value={values}>
      <AnalysisTab />
    </SettingsPanelContext.Provider>,
  )
  const mtValue = screen.getByTestId(ANALYSIS_BREAKDOWNS.mt)
  fireEvent.change(mtValue, {target: {value: 100}})
  expect(screen.queryByTestId(ANALYSIS_BREAKDOWNS.mt).value).toBe('100')
  fireEvent.blur(mtValue)
  expect(values.analysisTemplates.modifyingCurrentTemplate).toBeCalledTimes(1)
})

test('Change template', async () => {
  const {result} = renderHook(() => useTemplates(ANALYSIS_SCHEMA_KEYS))
  let values = {
    openLoginModal: jest.fn(),
    modifyingCurrentTemplate: jest.fn(),
    currentProjectTemplate: projectTemplatesMock.items[0],
    projectTemplates: projectTemplatesMock.items,
    analysisTemplates: result.current,
  }
  const projectContext = {
    languages: languagesMock,
  }
  const {rerender} = render(
    <SettingsPanelContext.Provider value={values}>
      <AnalysisTab />
    </SettingsPanelContext.Provider>,
  )
  await waitFor(() => expect(result.current.templates.length).not.toBe(0))
  values.analysisTemplates.modifyingCurrentTemplate = jest.fn()
  values.analysisTemplates = result.current
  rerender(
    <SettingsPanelContext.Provider value={values}>
      <AnalysisTab />
    </SettingsPanelContext.Provider>,
  )
  const select = screen.getByText('Default')
  fireEvent.click(select)
  const templateDropdown = screen.getByText(
    values.analysisTemplates.templates[1].payable_rate_template_name,
  )
  expect(templateDropdown).toBeInTheDocument()
  fireEvent.click(templateDropdown)

  values.analysisTemplates = result.current

  rerender(
    <CreateProjectContext.Provider value={projectContext}>
      <SettingsPanelContext.Provider value={values}>
        <AnalysisTab />
      </SettingsPanelContext.Provider>
    </CreateProjectContext.Provider>,
  )
  const currentAnalysisTemplate = result.current.templates?.find(
    ({id, isTemporary}) =>
      id === result.current.currentTemplate.id && !isTemporary,
  )
  for (const [key, value] of Object.entries(ANALYSIS_BREAKDOWNS)) {
    if (value !== '100%_PUBLIC' && value !== 'ICE') {
      const valuePerc = currentAnalysisTemplate.breakdowns.default[value] + '%'
      expect(screen.queryByTestId(ANALYSIS_BREAKDOWNS[key]).value).toBe(
        valuePerc,
      )
    }
  }
})
