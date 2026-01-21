import React from "react"
import { useFormContext, Controller } from "react-hook-form"

import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { UpdateSettingsInput } from "@shared/settings-schema"

type JobspySectionProps = {
  defaultJobspySites: string[]
  effectiveJobspySites: string[]
  defaultJobspyLocation: string
  effectiveJobspyLocation: string
  defaultJobspyResultsWanted: number
  effectiveJobspyResultsWanted: number
  defaultJobspyHoursOld: number
  effectiveJobspyHoursOld: number
  defaultJobspyCountryIndeed: string
  effectiveJobspyCountryIndeed: string
  defaultJobspyLinkedinFetchDescription: boolean
  effectiveJobspyLinkedinFetchDescription: boolean
  isLoading: boolean
  isSaving: boolean
}

export const JobspySection: React.FC<JobspySectionProps> = ({
  defaultJobspySites,
  effectiveJobspySites,
  defaultJobspyLocation,
  effectiveJobspyLocation,
  defaultJobspyResultsWanted,
  effectiveJobspyResultsWanted,
  defaultJobspyHoursOld,
  effectiveJobspyHoursOld,
  defaultJobspyCountryIndeed,
  effectiveJobspyCountryIndeed,
  defaultJobspyLinkedinFetchDescription,
  effectiveJobspyLinkedinFetchDescription,
  isLoading,
  isSaving,
}) => {
  const { control, register, formState: { errors } } = useFormContext<UpdateSettingsInput>()

  return (
    <AccordionItem value="jobspy" className="border rounded-lg px-4">
      <AccordionTrigger className="hover:no-underline py-4">
        <span className="text-base font-semibold">JobSpy Scraper</span>
      </AccordionTrigger>
      <AccordionContent className="pb-4">
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="text-sm font-medium">Scraped Sites</div>
            <div className="flex gap-6">
              <div className="flex items-center space-x-2">
                <Controller
                  name="jobspySites"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="site-indeed"
                      checked={field.value?.includes('indeed') ?? defaultJobspySites.includes('indeed')}
                      onCheckedChange={(checked) => {
                        const current = field.value ?? defaultJobspySites
                        let next = [...current]
                        if (checked) {
                          if (!next.includes('indeed')) next.push('indeed')
                        } else {
                          next = next.filter(s => s !== 'indeed')
                        }
                        field.onChange(next)
                      }}
                      disabled={isLoading || isSaving}
                    />
                  )}
                />
                <label htmlFor="site-indeed" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Indeed</label>
              </div>
              <div className="flex items-center space-x-2">
                <Controller
                  name="jobspySites"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="site-linkedin"
                      checked={field.value?.includes('linkedin') ?? defaultJobspySites.includes('linkedin')}
                      onCheckedChange={(checked) => {
                        const current = field.value ?? defaultJobspySites
                        let next = [...current]
                        if (checked) {
                          if (!next.includes('linkedin')) next.push('linkedin')
                        } else {
                          next = next.filter(s => s !== 'linkedin')
                        }
                        field.onChange(next)
                      }}
                      disabled={isLoading || isSaving}
                    />
                  )}
                />
                <label htmlFor="site-linkedin" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">LinkedIn</label>
              </div>
            </div>
            {errors.jobspySites && <p className="text-xs text-destructive">{errors.jobspySites.message}</p>}
            <div className="text-xs text-muted-foreground">
              Select which sites JobSpy should scrape.
            </div>
            <div className="flex gap-2 text-xs text-muted-foreground">
              <span>Effective: {(effectiveJobspySites || []).join(', ') || "None"}</span>
              <span>Default: {(defaultJobspySites || []).join(', ')}</span>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <div className="text-sm font-medium">Location</div>
              <Input
                {...register("jobspyLocation")}
                placeholder={defaultJobspyLocation || "UK"}
                disabled={isLoading || isSaving}
              />
              {errors.jobspyLocation && <p className="text-xs text-destructive">{errors.jobspyLocation.message}</p>}
              <div className="text-xs text-muted-foreground">
                Location to search for jobs (e.g. "UK", "London", "Remote").
              </div>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span>Effective: {effectiveJobspyLocation || "—"}</span>
                <span>Default: {defaultJobspyLocation || "—"}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Results Wanted</div>
              <Controller
                name="jobspyResultsWanted"
                control={control}
                render={({ field }) => (
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={1000}
                    value={field.value ?? ""}
                    onChange={(event) => {
                      const value = parseInt(event.target.value, 10)
                      if (Number.isNaN(value)) {
                        field.onChange(null)
                      } else {
                        field.onChange(Math.min(1000, Math.max(1, value)))
                      }
                    }}
                    disabled={isLoading || isSaving}
                  />
                )}
              />
              {errors.jobspyResultsWanted && <p className="text-xs text-destructive">{errors.jobspyResultsWanted.message}</p>}
              <div className="text-xs text-muted-foreground">
                Number of results to fetch per term per site. Max 1000.
              </div>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span>Effective: {effectiveJobspyResultsWanted}</span>
                <span>Default: {defaultJobspyResultsWanted}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Hours Old</div>
              <Controller
                name="jobspyHoursOld"
                control={control}
                render={({ field }) => (
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={720}
                    value={field.value ?? ""}
                    onChange={(event) => {
                      const value = parseInt(event.target.value, 10)
                      if (Number.isNaN(value)) {
                        field.onChange(null)
                      } else {
                        field.onChange(Math.min(720, Math.max(1, value)))
                      }
                    }}
                    disabled={isLoading || isSaving}
                  />
                )}
              />
              {errors.jobspyHoursOld && <p className="text-xs text-destructive">{errors.jobspyHoursOld.message}</p>}
              <div className="text-xs text-muted-foreground">
                Max age of jobs in hours (e.g. 72 for 3 days). Max 720 (30 days).
              </div>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span>Effective: {effectiveJobspyHoursOld}h</span>
                <span>Default: {defaultJobspyHoursOld}h</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Indeed Country</div>
              <Input
                {...register("jobspyCountryIndeed")}
                placeholder={defaultJobspyCountryIndeed || "UK"}
                disabled={isLoading || isSaving}
              />
              {errors.jobspyCountryIndeed && <p className="text-xs text-destructive">{errors.jobspyCountryIndeed.message}</p>}
              <div className="text-xs text-muted-foreground">
                Country domain for Indeed (e.g. "UK" for indeed.co.uk).
              </div>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span>Effective: {effectiveJobspyCountryIndeed || "—"}</span>
                <span>Default: {defaultJobspyCountryIndeed || "—"}</span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex items-center space-x-2">
            <Controller
              name="jobspyLinkedinFetchDescription"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="linkedin-desc"
                  checked={field.value ?? defaultJobspyLinkedinFetchDescription}
                  onCheckedChange={(checked) => field.onChange(!!checked)}
                  disabled={isLoading || isSaving}
                />
              )}
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="linkedin-desc"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Fetch LinkedIn Description
              </label>
              <p className="text-xs text-muted-foreground">
                If enabled, JobSpy will make extra requests to fetch full descriptions. Slower but better data.
              </p>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span>Effective: {effectiveJobspyLinkedinFetchDescription ? "Yes" : "No"}</span>
                <span>Default: {defaultJobspyLinkedinFetchDescription ? "Yes" : "No"}</span>
              </div>
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

