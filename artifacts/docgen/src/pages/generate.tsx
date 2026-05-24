import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useGenerateDoc, getListDocsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Terminal, Github, FileCode, Wand2, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  docType: z.string().min(1),
  sourceType: z.enum(["file", "github"]),
  sourceRef: z.string().optional(),
  codeContent: z.string().optional(),
  language: z.string().optional(),
}).refine(data => {
  if (data.sourceType === "github" && !data.sourceRef) return false;
  if (data.sourceType === "file" && !data.codeContent) return false;
  return true;
}, {
  message: "Source content is required",
  path: ["codeContent"],
});

type FormValues = z.infer<typeof formSchema>;

export default function GeneratePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const generateDoc = useGenerateDoc();
  const [activeTab, setActiveTab] = useState<"file" | "github">("file");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      docType: "readme",
      sourceType: "file",
      sourceRef: "",
      codeContent: "",
      language: "",
    },
  });

  function onSubmit(values: FormValues) {
    generateDoc.mutate(
      { data: values },
      {
        onSuccess: (doc) => {
          queryClient.invalidateQueries({ queryKey: getListDocsQueryKey() });
          toast({ title: "Success", description: "Documentation generated successfully." });
          setLocation(`/doc/${doc.id}`);
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to generate documentation. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  }

  const isPending = generateDoc.isPending;

  const inputClass =
    "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50";
  const labelClass = "block text-sm font-medium text-foreground mb-1";
  const errorClass = "mt-1 text-xs text-red-400";

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 animate-in fade-in duration-500 pb-12">
      {/* Form Section */}
      <div className="w-full md:w-1/2 lg:w-5/12 flex flex-col">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Generate Docs</h1>
          <p className="text-muted-foreground mb-6">AI will analyze your code and craft professional documentation.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 flex-1 flex flex-col">
          <div className="space-y-4 flex-1">
            {/* Title */}
            <div>
              <label htmlFor="title" className={labelClass}>Project / File Name</label>
              <input
                id="title"
                {...register("title")}
                placeholder="e.g. auth-service.ts"
                disabled={isPending}
                data-testid="input-title"
                className={inputClass}
              />
              {errors.title && <p className={errorClass}>{errors.title.message}</p>}
            </div>

            {/* Doc Type + Language */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="docType" className={labelClass}>Document Type</label>
                <select
                  id="docType"
                  {...register("docType")}
                  disabled={isPending}
                  data-testid="select-doctype"
                  className={inputClass}
                >
                  <option value="readme">README.md</option>
                  <option value="api">API Reference</option>
                  <option value="functions">Function Breakdown</option>
                  <option value="setup">Setup Guide</option>
                  <option value="changelog">Changelog</option>
                  <option value="overview">Project Overview</option>
                </select>
                {errors.docType && <p className={errorClass}>{errors.docType.message}</p>}
              </div>

              <div>
                <label htmlFor="language" className={labelClass}>Language (Optional)</label>
                <input
                  id="language"
                  {...register("language")}
                  placeholder="e.g. TypeScript"
                  disabled={isPending}
                  data-testid="input-language"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Source Code Tabs */}
            <div className="pt-2">
              <p className={labelClass}>Source Code</p>
              <Tabs
                value={activeTab}
                onValueChange={(v) => {
                  const type = v as "file" | "github";
                  setActiveTab(type);
                  setValue("sourceType", type);
                }}
              >
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="file" disabled={isPending} data-testid="tab-file">
                    <FileCode className="w-4 h-4 mr-2" />
                    Paste Code
                  </TabsTrigger>
                  <TabsTrigger value="github" disabled={isPending} data-testid="tab-github">
                    <Github className="w-4 h-4 mr-2" />
                    GitHub URL
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="file" className="mt-0 h-[300px] flex flex-col">
                  <textarea
                    {...register("codeContent")}
                    placeholder="Paste your raw code here..."
                    disabled={isPending}
                    data-testid="textarea-code"
                    className="flex-1 w-full rounded-md border border-border bg-[#1a1b26] px-3 py-2 font-mono text-xs text-[#a9b1d6] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none disabled:opacity-50 h-full"
                  />
                  {errors.codeContent && <p className={errorClass}>{errors.codeContent.message}</p>}
                </TabsContent>

                <TabsContent value="github" className="mt-0 h-[300px]">
                  <p className="text-sm text-muted-foreground mb-3">
                    Provide a direct link to a GitHub repository or specific file.
                  </p>
                  <input
                    {...register("sourceRef")}
                    placeholder="https://github.com/user/repo"
                    disabled={isPending}
                    data-testid="input-github"
                    className={inputClass}
                  />
                  {errors.sourceRef && <p className={errorClass}>{errors.sourceRef.message}</p>}
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending}
            data-testid="btn-generate-submit"
            className="w-full mt-4 h-12 text-base font-semibold rounded-md bg-primary text-primary-foreground flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Generating Documentation...
              </>
            ) : (
              <>
                <Wand2 className="h-5 w-5" />
                Generate Now
              </>
            )}
          </button>
        </form>
      </div>

      {/* Preview Section */}
      <div className="w-full md:w-1/2 lg:w-7/12 mt-8 md:mt-0 bg-[#0f1016] rounded-xl border border-border overflow-hidden flex flex-col relative shadow-2xl">
        <div className="h-10 border-b border-border bg-[#1a1b26] flex items-center px-4 shrink-0 justify-between">
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
          </div>
          <div className="text-xs font-mono text-muted-foreground flex items-center">
            <Terminal className="w-3 h-3 mr-2" />
            output.md
          </div>
        </div>

        <div className="flex-1 p-6 relative font-mono text-sm text-[#a9b1d6] overflow-y-auto">
          {isPending ? (
            <div className="space-y-4">
              <div className="flex items-center text-primary">
                <span className="mr-2 text-green-400">❯</span>
                <span className="typing-animation overflow-hidden whitespace-nowrap border-r-2 border-primary pr-2">
                  Analyzing syntax tree and extracting symbols...
                </span>
              </div>
              <div className="flex items-center text-primary opacity-0 animate-[fade-in_0.5s_ease-out_1s_forward] fill-mode-forwards">
                <span className="mr-2 text-green-400">❯</span>
                <span className="typing-animation-2 overflow-hidden whitespace-nowrap border-r-2 border-primary pr-2">
                  Generating architectural overview...
                </span>
              </div>
              <div className="flex items-center text-primary opacity-0 animate-[fade-in_0.5s_ease-out_3s_forward] fill-mode-forwards">
                <span className="mr-2 text-green-400">❯</span>
                <span className="typing-animation-3 overflow-hidden whitespace-nowrap border-r-2 border-transparent pr-2">
                  Drafting markdown output...
                </span>
              </div>

              <div className="mt-8 space-y-2 opacity-50">
                <div className="h-4 bg-[#1a1b26] rounded w-3/4 animate-pulse" />
                <div className="h-4 bg-[#1a1b26] rounded w-1/2 animate-pulse" />
                <div className="h-4 bg-[#1a1b26] rounded w-5/6 animate-pulse" />
                <div className="h-4 bg-[#1a1b26] rounded w-full animate-pulse mt-4" />
                <div className="h-4 bg-[#1a1b26] rounded w-full animate-pulse" />
                <div className="h-4 bg-[#1a1b26] rounded w-2/3 animate-pulse" />
              </div>

              <style>{`
                .typing-animation {
                  animation: typing 1s steps(40, end), blink-caret .75s step-end infinite;
                  max-width: fit-content;
                }
                .typing-animation-2 {
                  animation: typing 1.5s steps(40, end) 1s, blink-caret .75s step-end infinite;
                  max-width: fit-content;
                }
                .typing-animation-3 {
                  animation: typing 2s steps(40, end) 3s, blink-caret-final .75s step-end infinite 3s;
                  max-width: fit-content;
                }
                @keyframes typing {
                  from { max-width: 0 }
                  to { max-width: 100% }
                }
                @keyframes blink-caret {
                  from, to { border-color: transparent }
                  50% { border-color: hsl(var(--primary)) }
                }
                @keyframes blink-caret-final {
                  from, to { border-color: transparent }
                  50% { border-color: hsl(var(--primary)) }
                }
                .fill-mode-forwards {
                  animation-fill-mode: forwards;
                }
              `}</style>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
              <Terminal className="w-12 h-12 mb-4 opacity-20" />
              <p>Ready to generate documentation.</p>
              <p className="text-xs mt-2">Output will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
