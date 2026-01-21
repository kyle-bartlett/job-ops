import React, { useEffect, useState } from "react"
import { Settings } from "lucide-react"
import { toast } from "sonner"
import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { PageHeader } from "@client/components/layout"
import { Accordion } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import type { AppSettings, JobStatus } from "@shared/types"
import { updateSettingsSchema, type UpdateSettingsInput } from "@shared/settings-schema"
import * as api from "@client/api"
import { resumeProjectsEqual } from "@client/pages/settings/utils"
import { DangerZoneSection } from "@client/pages/settings/components/DangerZoneSection"
import { DisplaySettingsSection } from "@client/pages/settings/components/DisplaySettingsSection"
import { GradcrackerSection } from "@client/pages/settings/components/GradcrackerSection"
import { JobCompleteWebhookSection } from "@client/pages/settings/components/JobCompleteWebhookSection"
import { JobspySection } from "@client/pages/settings/components/JobspySection"
import { ModelSettingsSection } from "@client/pages/settings/components/ModelSettingsSection"
import { PipelineWebhookSection } from "@client/pages/settings/components/PipelineWebhookSection"
import { ResumeProjectsSection } from "@client/pages/settings/components/ResumeProjectsSection"
import { SearchTermsSection } from "@client/pages/settings/components/SearchTermsSection"
import { UkvisajobsSection } from "@client/pages/settings/components/UkvisajobsSection"

const DEFAULT_FORM_VALUES: UpdateSettingsInput = {
  model: "",
  modelScorer: "",
  modelTailoring: "",
  modelProjectSelection: "",
  pipelineWebhookUrl: "",
  jobCompleteWebhookUrl: "",
  resumeProjects: null,
  ukvisajobsMaxJobs: null,
  gradcrackerMaxJobsPerTerm: null,
  searchTerms: null,
  jobspyLocation: null,
  jobspyResultsWanted: null,
  jobspyHoursOld: null,
  jobspyCountryIndeed: null,
  jobspySites: null,
  jobspyLinkedinFetchDescription: null,
  showSponsorInfo: null,
}

const NULL_SETTINGS_PAYLOAD: UpdateSettingsInput = {
  model: null,
  modelScorer: null,
  modelTailoring: null,
  modelProjectSelection: null,
  pipelineWebhookUrl: null,
  jobCompleteWebhookUrl: null,
  resumeProjects: null,
  ukvisajobsMaxJobs: null,
  gradcrackerMaxJobsPerTerm: null,
  searchTerms: null,
  jobspyLocation: null,
  jobspyResultsWanted: null,
  jobspyHoursOld: null,
  jobspyCountryIndeed: null,
  jobspySites: null,
  jobspyLinkedinFetchDescription: null,
  showSponsorInfo: null,
}

const mapSettingsToForm = (data: AppSettings): UpdateSettingsInput => ({
  model: data.overrideModel ?? "",
  modelScorer: data.overrideModelScorer ?? "",
  modelTailoring: data.overrideModelTailoring ?? "",
  modelProjectSelection: data.overrideModelProjectSelection ?? "",
  pipelineWebhookUrl: data.overridePipelineWebhookUrl ?? "",
  jobCompleteWebhookUrl: data.overrideJobCompleteWebhookUrl ?? "",
  resumeProjects: data.resumeProjects,
  ukvisajobsMaxJobs: data.overrideUkvisajobsMaxJobs,
  gradcrackerMaxJobsPerTerm: data.overrideGradcrackerMaxJobsPerTerm,
  searchTerms: data.overrideSearchTerms,
  jobspyLocation: data.overrideJobspyLocation,
  jobspyResultsWanted: data.overrideJobspyResultsWanted,
  jobspyHoursOld: data.overrideJobspyHoursOld,
  jobspyCountryIndeed: data.overrideJobspyCountryIndeed,
  jobspySites: data.overrideJobspySites,
  jobspyLinkedinFetchDescription: data.overrideJobspyLinkedinFetchDescription,
  showSponsorInfo: data.overrideShowSponsorInfo,
})

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [statusesToClear, setStatusesToClear] = useState<JobStatus[]>(['discovered'])

  const methods = useForm<UpdateSettingsInput>({
    resolver: zodResolver(updateSettingsSchema),
    mode: "onChange",
    defaultValues: DEFAULT_FORM_VALUES,
  })

  const { handleSubmit, reset, watch, formState: { isDirty, errors, isValid } } = methods

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)
    api
      .getSettings()
      .then((data) => {
        if (!isMounted) return
        setSettings(data)
        reset(mapSettingsToForm(data))
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : "Failed to load settings"
        toast.error(message)
      })
      .finally(() => {
        if (!isMounted) return
        setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [reset])

  const effectiveModel = settings?.model ?? ""
  const defaultModel = settings?.defaultModel ?? ""
  const effectiveModelScorer = settings?.modelScorer ?? ""
  const effectiveModelTailoring = settings?.modelTailoring ?? ""
  const effectiveModelProjectSelection = settings?.modelProjectSelection ?? ""
  const effectivePipelineWebhookUrl = settings?.pipelineWebhookUrl ?? ""
  const defaultPipelineWebhookUrl = settings?.defaultPipelineWebhookUrl ?? ""
  const effectiveJobCompleteWebhookUrl = settings?.jobCompleteWebhookUrl ?? ""
  const defaultJobCompleteWebhookUrl = settings?.defaultJobCompleteWebhookUrl ?? ""
  const effectiveUkvisajobsMaxJobs = settings?.ukvisajobsMaxJobs ?? 50
  const defaultUkvisajobsMaxJobs = settings?.defaultUkvisajobsMaxJobs ?? 50
  const effectiveGradcrackerMaxJobsPerTerm = settings?.gradcrackerMaxJobsPerTerm ?? 50
  const defaultGradcrackerMaxJobsPerTerm = settings?.defaultGradcrackerMaxJobsPerTerm ?? 50
  const effectiveSearchTerms = settings?.searchTerms ?? []
  const defaultSearchTerms = settings?.defaultSearchTerms ?? []
  const effectiveJobspyLocation = settings?.jobspyLocation ?? ""
  const defaultJobspyLocation = settings?.defaultJobspyLocation ?? ""
  const effectiveJobspyResultsWanted = settings?.jobspyResultsWanted ?? 200
  const defaultJobspyResultsWanted = settings?.defaultJobspyResultsWanted ?? 200
  const effectiveJobspyHoursOld = settings?.jobspyHoursOld ?? 72
  const defaultJobspyHoursOld = settings?.defaultJobspyHoursOld ?? 72
  const effectiveJobspyCountryIndeed = settings?.jobspyCountryIndeed ?? ""
  const defaultJobspyCountryIndeed = settings?.defaultJobspyCountryIndeed ?? ""
  const effectiveJobspySites = settings?.jobspySites ?? ["indeed", "linkedin"]
  const defaultJobspySites = settings?.defaultJobspySites ?? ["indeed", "linkedin"]
  const effectiveJobspyLinkedinFetchDescription = settings?.jobspyLinkedinFetchDescription ?? true
  const defaultJobspyLinkedinFetchDescription = settings?.defaultJobspyLinkedinFetchDescription ?? true
  const effectiveShowSponsorInfo = settings?.showSponsorInfo ?? true
  const defaultShowSponsorInfo = settings?.defaultShowSponsorInfo ?? true
  const profileProjects = settings?.profileProjects ?? []
  const maxProjectsTotal = profileProjects.length

  const watchedValues = watch()
  const lockedCount = watchedValues.resumeProjects?.lockedProjectIds.length ?? 0

  const canSave = isDirty && isValid

  const onSave = async (data: UpdateSettingsInput) => {
    if (!settings) return
    try {
      setIsSaving(true)
      
      // Prepare payload: nullify if equal to default
      const resumeProjectsData = data.resumeProjects
      const resumeProjectsOverride = (resumeProjectsData && settings.defaultResumeProjects && resumeProjectsEqual(resumeProjectsData, settings.defaultResumeProjects))
        ? null
        : resumeProjectsData

      const payload: UpdateSettingsInput = {
        model: data.model?.trim() || null,
        modelScorer: data.modelScorer?.trim() || null,
        modelTailoring: data.modelTailoring?.trim() || null,
        modelProjectSelection: data.modelProjectSelection?.trim() || null,
        pipelineWebhookUrl: data.pipelineWebhookUrl?.trim() || null,
        jobCompleteWebhookUrl: data.jobCompleteWebhookUrl?.trim() || null,
        resumeProjects: resumeProjectsOverride,
        ukvisajobsMaxJobs: data.ukvisajobsMaxJobs === defaultUkvisajobsMaxJobs ? null : data.ukvisajobsMaxJobs,
        gradcrackerMaxJobsPerTerm: data.gradcrackerMaxJobsPerTerm === defaultGradcrackerMaxJobsPerTerm ? null : data.gradcrackerMaxJobsPerTerm,
        searchTerms: JSON.stringify(data.searchTerms) === JSON.stringify(defaultSearchTerms) ? null : data.searchTerms,
        jobspyLocation: data.jobspyLocation === defaultJobspyLocation ? null : data.jobspyLocation,
        jobspyResultsWanted: data.jobspyResultsWanted === defaultJobspyResultsWanted ? null : data.jobspyResultsWanted,
        jobspyHoursOld: data.jobspyHoursOld === defaultJobspyHoursOld ? null : data.jobspyHoursOld,
        jobspyCountryIndeed: data.jobspyCountryIndeed === defaultJobspyCountryIndeed ? null : data.jobspyCountryIndeed,
        jobspySites: JSON.stringify((data.jobspySites ?? []).slice().sort()) === JSON.stringify((defaultJobspySites ?? []).slice().sort()) ? null : data.jobspySites,
        jobspyLinkedinFetchDescription: data.jobspyLinkedinFetchDescription === defaultJobspyLinkedinFetchDescription ? null : data.jobspyLinkedinFetchDescription,
        showSponsorInfo: data.showSponsorInfo === defaultShowSponsorInfo ? null : data.showSponsorInfo,
      }

      const updated = await api.updateSettings(payload)
      setSettings(updated)
      reset(mapSettingsToForm(updated))
      toast.success("Settings saved")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save settings"
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleClearDatabase = async () => {
    try {
      setIsSaving(true)
      const result = await api.clearDatabase()
      toast.success("Database cleared", { description: `Deleted ${result.jobsDeleted} jobs.` })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to clear database"
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleClearByStatuses = async () => {
    if (statusesToClear.length === 0) {
      toast.error("No statuses selected")
      return
    }
    try {
      setIsSaving(true)
      let totalDeleted = 0
      const results: string[] = []

      for (const status of statusesToClear) {
        const result = await api.deleteJobsByStatus(status)
        totalDeleted += result.count
        if (result.count > 0) {
          results.push(`${result.count} ${status}`)
        }
      }

      if (totalDeleted > 0) {
        toast.success("Jobs cleared", {
          description: `Deleted ${totalDeleted} jobs: ${results.join(', ')}`,
        })
      } else {
        toast.info("No jobs found", {
          description: `No jobs with selected statuses found`,
        })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to clear jobs"
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const toggleStatusToClear = (status: JobStatus) => {
    setStatusesToClear(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    )
  }
  const handleReset = async () => {
    try {
      setIsSaving(true)
      const updated = await api.updateSettings(NULL_SETTINGS_PAYLOAD)
      setSettings(updated)
      reset(mapSettingsToForm(updated))
      toast.success("Reset to default")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to reset settings"
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <FormProvider {...methods}>
      <PageHeader
        icon={Settings}
        title="Settings"
        subtitle="Configure runtime behavior for this app."
      />

      <main className="container mx-auto max-w-3xl space-y-6 px-4 py-6 pb-12">
        <Accordion type="multiple" className="w-full space-y-4">
          <ModelSettingsSection
            effectiveModel={effectiveModel}
            effectiveModelScorer={effectiveModelScorer}
            effectiveModelTailoring={effectiveModelTailoring}
            effectiveModelProjectSelection={effectiveModelProjectSelection}
            defaultModel={defaultModel}
            isLoading={isLoading}
            isSaving={isSaving}
          />
          <PipelineWebhookSection
            defaultPipelineWebhookUrl={defaultPipelineWebhookUrl}
            effectivePipelineWebhookUrl={effectivePipelineWebhookUrl}
            isLoading={isLoading}
            isSaving={isSaving}
          />
          <JobCompleteWebhookSection
            defaultJobCompleteWebhookUrl={defaultJobCompleteWebhookUrl}
            effectiveJobCompleteWebhookUrl={effectiveJobCompleteWebhookUrl}
            isLoading={isLoading}
            isSaving={isSaving}
          />
          <UkvisajobsSection
            defaultUkvisajobsMaxJobs={defaultUkvisajobsMaxJobs}
            effectiveUkvisajobsMaxJobs={effectiveUkvisajobsMaxJobs}
            isLoading={isLoading}
            isSaving={isSaving}
          />
          <GradcrackerSection
            defaultGradcrackerMaxJobsPerTerm={defaultGradcrackerMaxJobsPerTerm}
            effectiveGradcrackerMaxJobsPerTerm={effectiveGradcrackerMaxJobsPerTerm}
            isLoading={isLoading}
            isSaving={isSaving}
          />
          <SearchTermsSection
            defaultSearchTerms={defaultSearchTerms}
            effectiveSearchTerms={effectiveSearchTerms}
            isLoading={isLoading}
            isSaving={isSaving}
          />
          <JobspySection
            defaultJobspySites={defaultJobspySites}
            effectiveJobspySites={effectiveJobspySites}
            defaultJobspyLocation={defaultJobspyLocation}
            effectiveJobspyLocation={effectiveJobspyLocation}
            defaultJobspyResultsWanted={defaultJobspyResultsWanted}
            effectiveJobspyResultsWanted={effectiveJobspyResultsWanted}
            defaultJobspyHoursOld={defaultJobspyHoursOld}
            effectiveJobspyHoursOld={effectiveJobspyHoursOld}
            defaultJobspyCountryIndeed={defaultJobspyCountryIndeed}
            effectiveJobspyCountryIndeed={effectiveJobspyCountryIndeed}
            defaultJobspyLinkedinFetchDescription={defaultJobspyLinkedinFetchDescription}
            effectiveJobspyLinkedinFetchDescription={effectiveJobspyLinkedinFetchDescription}
            isLoading={isLoading}
            isSaving={isSaving}
          />
          <ResumeProjectsSection
            profileProjects={profileProjects}
            lockedCount={lockedCount}
            maxProjectsTotal={maxProjectsTotal}
            isLoading={isLoading}
            isSaving={isSaving}
          />
          <DisplaySettingsSection
            defaultShowSponsorInfo={defaultShowSponsorInfo}
            effectiveShowSponsorInfo={effectiveShowSponsorInfo}
            isLoading={isLoading}
            isSaving={isSaving}
          />
          <DangerZoneSection
            statusesToClear={statusesToClear}
            toggleStatusToClear={toggleStatusToClear}
            handleClearByStatuses={handleClearByStatuses}
            handleClearDatabase={handleClearDatabase}
            isLoading={isLoading}
            isSaving={isSaving}
          />
        </Accordion>

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleSubmit(onSave)} disabled={isLoading || isSaving || !canSave}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
          <Button variant="outline" onClick={handleReset} disabled={isLoading || isSaving || !settings}>
            Reset to default
          </Button>
        </div>
        {Object.keys(errors).length > 0 && (
          <div className="text-destructive text-sm mt-2">
            Please fix the errors before saving.
          </div>
        )}
      </main>
    </FormProvider>
  )
}
