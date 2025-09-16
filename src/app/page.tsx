"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface BoilerPlateSnippet {
  id: number;
  problem_id: number;
  code_snippet: string;
  language: string;
  extension: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface Problem {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  function_name: string;
  parameters: { name: string; type: string }[];
  public_test_cases: string;
  private_test_cases: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  boilerPlateSnippets: BoilerPlateSnippet[];
}

interface TestResult {
  index: number;
  description: string;
  status: string; // "passed" or "failed"
  expected: any[];
  error: string;
}

interface ExecutionResult {
  success: boolean;
  output: string;
  executionTime: number;
  memoryUsed: number;
  testResults: TestResult[];
}

interface JobStatus {
  id: string;
  name: string;
  progress: number;
  state: string;
  result?: ExecutionResult;
  error?: string;
  processedOn: number;
  finishedOn: number;
}

interface SubmitResponse {
  passed: number;
  total: number;
  testResults?: TestResult[];
  executionTime?: number;
  memoryUsed?: number;
}

const languages = [
  { value: "javascript", label: "JavaScript", extension: "js" },
  { value: "python", label: "Python", extension: "py" },
  { value: "java", label: "Java", extension: "java" },
  { value: "cpp", label: "C++", extension: "cpp" },
];

export default function Home() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [results, setResults] = useState<SubmitResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);

  useEffect(() => {
    fetchProblems();
  }, []);

  useEffect(() => {
    if (jobId) {
      console.log("Starting polling for jobId:", jobId);
      const interval = setInterval(() => {
        checkJobStatus(jobId);
      }, 1000);
      return () => {
        console.log("Clearing polling interval for jobId:", jobId);
        clearInterval(interval);
      };
    }
  }, [jobId]);

  useEffect(() => {
    if (selectedProblem) {
      const snippet = selectedProblem.boilerPlateSnippets.find(
        (s) => s.language === language
      );
      setCode(snippet ? snippet.code_snippet : "");
    }
  }, [language, selectedProblem]);

  const fetchProblems = async () => {
    try {
      const response = await fetch("http://210.79.128.128:8080/api/problem");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const responseData = await response.json();
      const data = responseData.data;
      if (!Array.isArray(data)) {
        console.error("Expected array of problems in data, got:", responseData);
        return;
      }
      setProblems(data);
      const defaultProblem = data.find((p) => p.id === 1);
      if (defaultProblem) {
        selectProblem(defaultProblem);
      }
    } catch (error) {
      console.error("Failed to fetch problems:", error);
    }
  };

  const selectProblem = (problem: Problem) => {
    setSelectedProblem(problem);
    const snippet = problem.boilerPlateSnippets.find(
      (s) => s.language === language
    );
    setCode(snippet ? snippet.code_snippet : "");
    setResults(null);
    setJobId(null);
  };

  const getExtension = (lang: string) => {
    const langObj = languages.find((l) => l.value === lang);
    return langObj?.extension || "js";
  };

  const submitCode = async () => {
    if (!selectedProblem) return;
    setLoading(true);
    setResults(null);
    setJobId(null); // Clear any previous jobId
    try {
      console.log("Submitting code for problem:", selectedProblem.id);
      const response = await fetch(
        "http://210.79.128.128:8080/api/jobs/execute/public",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            problemId: selectedProblem.id,
            code: btoa(code),
            language,
            extension: getExtension(language),
            userId: "user1",
            timeout: 5000,
            memoryLimit: 128,
          }),
        }
      );
      const data = await response.json();
      console.log("Submit response:", data);
      if (data.data && data.data.jobId) {
        setJobId(data.data.jobId);
        console.log("Job ID set to:", data.data.jobId);
      } else {
        console.error("No job ID in response:", data);
        setLoading(false);
      }
    } catch (error) {
      console.error("Failed to submit code:", error);
      setLoading(false);
    }
  };

  const checkJobStatus = async (id: string) => {
    try {
      console.log("Checking job status for ID:", id);
      const response = await fetch(
        `http://210.79.128.128:8080/api/jobs/status/${id}`
      );
      const status: JobStatus = await response.json();
      console.log("Job status response:", status);
      
      if (status.state === "completed") {
        console.log("Job completed, processing results");
        setLoading(false);
        setJobId(null);
        if (status.result) {
          const passed = status.result.testResults.filter((tr) => tr.status === "passed")
            .length;
          const total = status.result.testResults.length;
          console.log(`Results: ${passed}/${total} passed`);
          setResults({ 
            passed, 
            total, 
            testResults: status.result.testResults,
            executionTime: status.result.executionTime,
            memoryUsed: status.result.memoryUsed
          });
        }
      } else if (status.state === "failed") {
        console.log("Job failed:", status.error);
        setLoading(false);
        setJobId(null);
        console.error("Job failed:", status.error);
      } else {
        console.log("Job still in progress, state:", status.state);
      }
    } catch (error) {
      console.error("Failed to check job status:", error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Coding Platform</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Problems</CardTitle>
            </CardHeader>
            <CardContent>
              {problems.map((problem) => (
                <Button
                  key={problem.id}
                  variant={
                    selectedProblem?.id === problem.id ? "default" : "outline"
                  }
                  className="w-full mb-2"
                  onClick={() => selectProblem(problem)}
                >
                  {problem.title}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2">
          {selectedProblem ? (
            <Card>
              <CardHeader>
                <CardTitle>{selectedProblem.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">{selectedProblem.description}</p>
                <div className="mb-4 flex gap-2">
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="mb-4">
                  <Editor
                    height="400px"
                    language={language}
                    value={code}
                    onChange={(value) => setCode(value || "")}
                    theme="vs-dark"
                  />
                </div>
                <Button onClick={submitCode} disabled={loading}>
                  {loading ? "Submitting..." : "Submit"}
                </Button>
                {results && (
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center gap-4">
                      <Badge
                        variant={
                          results.passed === results.total
                            ? "default"
                            : "destructive"
                        }
                        className="text-sm"
                      >
                        {results.passed} / {results.total} passed
                      </Badge>
                      <div className="flex-1">
                        <Progress 
                          value={(results.passed / results.total) * 100} 
                          className="h-2"
                        />
                      </div>
                    </div>
                    
                    {results.executionTime && results.memoryUsed && (
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>⏱️ {results.executionTime}ms</span>
                        <span>💾 {(results.memoryUsed / 1024 / 1024).toFixed(2)}MB</span>
                      </div>
                    )}

                    {results.testResults && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Test Results</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-20">Test</TableHead>
                                <TableHead className="w-20">Status</TableHead>
                                <TableHead>Expected</TableHead>
                                <TableHead>Error</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {results.testResults.map((test) => (
                                <TableRow key={test.index}>
                                  <TableCell className="font-medium">
                                    #{test.index}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        test.status === "passed"
                                          ? "default"
                                          : "destructive"
                                      }
                                      className="text-xs"
                                    >
                                      {test.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="font-mono text-sm">
                                    {JSON.stringify(test.expected)}
                                  </TableCell>
                                  <TableCell className="text-sm text-red-600">
                                    {test.error || "-"}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <p>Loading problems...</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
