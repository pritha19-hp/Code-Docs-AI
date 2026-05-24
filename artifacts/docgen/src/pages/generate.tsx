import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useGenerateDoc, getListDocsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Terminal, Github, FileCode, Wand2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
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
  if (data.sourceType === 'github' && !data.sourceRef) return false;
  if (data.sourceType === 'file' && !data.codeContent) return false;
  return true;
}, {
  message: "Source content is required",
  path: ["codeContent"]
});

export default function GeneratePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const generateDoc = useGenerateDoc();
  const [activeTab, setActiveTab] = useState<"file" | "github">("file");

  const form = useForm<z.infer<typeof formSchema>>({
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

  function onSubmit(values: z.infer<typeof formSchema>) {
    generateDoc.mutate(
      { data: values },
      {
        onSuccess: (doc) => {
          queryClient.invalidateQueries({ queryKey: getListDocsQueryKey() });
          toast({
            title: "Success",
            description: "Documentation generated successfully.",
          });
          setLocation(`/doc/${doc.id}`);
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to generate documentation. Please try again.",
            variant: "destructive",
          });
        }
      }
    );
  }

  const isPending = generateDoc.isPending;

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 animate-in fade-in duration-500 pb-12">
      {/* Form Section */}
      <div className="w-full md:w-1/2 lg:w-5/12 flex flex-col">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Generate Docs</h1>
          <p className="text-muted-foreground mb-6">AI will analyze your code and craft professional documentation.</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 flex-1 flex flex-col">
            <div className="space-y-4 flex-1">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project / File Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. auth-service.ts" {...field} data-testid="input-title" disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="docType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPending}>
                        <FormControl>
                          <SelectTrigger data-testid="select-doctype">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="readme">README.md</SelectItem>
                          <SelectItem value="api">API Reference</SelectItem>
                          <SelectItem value="functions">Function Breakdown</SelectItem>
                          <SelectItem value="setup">Setup Guide</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. TypeScript" {...field} data-testid="input-language" disabled={isPending} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-2">
                <FormLabel className="mb-2 block">Source Code</FormLabel>
                <Tabs value={activeTab} onValueChange={(v) => {
                  const type = v as "file" | "github";
                  setActiveTab(type);
                  form.setValue("sourceType", type);
                }}>
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
                    <FormField
                      control={form.control}
                      name="codeContent"
                      render={({ field }) => (
                        <FormItem className="flex-1 flex flex-col">
                          <FormControl className="flex-1">
                            <Textarea 
                              placeholder="Paste your raw code here..." 
                              className="font-mono text-xs resize-none flex-1 bg-[#1a1b26] text-[#a9b1d6] border-border focus-visible:ring-primary h-full"
                              {...field}
                              data-testid="textarea-code"
                              disabled={isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                  
                  <TabsContent value="github" className="mt-0 h-[300px]">
                    <FormField
                      control={form.control}
                      name="sourceRef"
                      render={({ field }) => (
                        <FormItem>
                          <FormDescription className="mb-3">
                            Provide a direct link to a GitHub repository or specific file.
                          </FormDescription>
                          <FormControl>
                            <Input 
                              placeholder="https://github.com/user/repo" 
                              {...field}
                              data-testid="input-github"
                              disabled={isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full mt-4 h-12 text-base font-semibold" 
              disabled={isPending}
              data-testid="btn-generate-submit"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating Documentation...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-5 w-5" />
                  Generate Now
                </>
              )}
            </Button>
          </form>
        </Form>
      </div>

      {/* Preview Section */}
      <div className="w-full md:w-1/2 lg:w-7/12 mt-8 md:mt-0 bg-[#0f1016] rounded-xl border border-border overflow-hidden flex flex-col relative shadow-2xl">
        <div className="h-10 border-b border-border bg-[#1a1b26] flex items-center px-4 shrink-0 justify-between">
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
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
                <div className="h-4 bg-[#1a1b26] rounded w-3/4 animate-pulse"></div>
                <div className="h-4 bg-[#1a1b26] rounded w-1/2 animate-pulse"></div>
                <div className="h-4 bg-[#1a1b26] rounded w-5/6 animate-pulse"></div>
                <div className="h-4 bg-[#1a1b26] rounded w-full animate-pulse mt-4"></div>
                <div className="h-4 bg-[#1a1b26] rounded w-full animate-pulse"></div>
                <div className="h-4 bg-[#1a1b26] rounded w-2/3 animate-pulse"></div>
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
