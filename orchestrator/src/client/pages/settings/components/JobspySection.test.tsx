import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { useForm, FormProvider } from "react-hook-form"

import { Accordion } from "@/components/ui/accordion"
import { JobspySection } from "./JobspySection"
import { UpdateSettingsInput } from "@shared/settings-schema"

const JobspyHarness = () => {
  const methods = useForm<UpdateSettingsInput>({
    defaultValues: {
      jobspySites: ["indeed", "linkedin"],
      jobspyLocation: "UK",
      jobspyResultsWanted: 200,
      jobspyHoursOld: 72,
      jobspyCountryIndeed: "UK",
      jobspyLinkedinFetchDescription: true,
    }
  })

  return (
    <FormProvider {...methods}>
      <Accordion type="multiple" defaultValue={["jobspy"]}>
        <JobspySection
          defaultJobspySites={["indeed", "linkedin"]}
          effectiveJobspySites={["indeed", "linkedin"]}
          defaultJobspyLocation="UK"
          effectiveJobspyLocation="UK"
          defaultJobspyResultsWanted={200}
          effectiveJobspyResultsWanted={200}
          defaultJobspyHoursOld={72}
          effectiveJobspyHoursOld={72}
          defaultJobspyCountryIndeed="UK"
          effectiveJobspyCountryIndeed="UK"
          defaultJobspyLinkedinFetchDescription={true}
          effectiveJobspyLinkedinFetchDescription={true}
          isLoading={false}
          isSaving={false}
        />
      </Accordion>
    </FormProvider>
  )
}


describe("JobspySection", () => {
  it("toggles scraped sites and keeps checkboxes in sync", () => {
    render(<JobspyHarness />)

    const indeedCheckbox = screen.getByLabelText("Indeed")
    const linkedinCheckbox = screen.getByLabelText("LinkedIn")

    expect(indeedCheckbox).toBeChecked()
    expect(linkedinCheckbox).toBeChecked()

    fireEvent.click(indeedCheckbox)
    expect(indeedCheckbox).not.toBeChecked()
    expect(linkedinCheckbox).toBeChecked()

    fireEvent.click(indeedCheckbox)
    expect(indeedCheckbox).toBeChecked()
  })

  it("clamps numeric inputs to allowed ranges", () => {
    render(<JobspyHarness />)

    const numericInputs = screen.getAllByRole("spinbutton")
    const resultsWantedInput = numericInputs[0]
    const hoursOldInput = numericInputs[1]

    fireEvent.change(resultsWantedInput, { target: { value: "1001" } })
    expect(resultsWantedInput).toHaveValue(1000)

    fireEvent.change(hoursOldInput, { target: { value: "0" } })
    expect(hoursOldInput).toHaveValue(1)
  })
})
