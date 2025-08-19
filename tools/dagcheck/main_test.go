package main

import (
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestParseAgentFile(t *testing.T) {
	tests := []struct {
		name        string
		content     string
		expected    Agent
		expectError bool
	}{
		{
			name: "valid agent with handoff_to",
			content: `---
name: test-agent
handoff_to: "target-agent"
---

# Test Agent
Some content here.`,
			expected: Agent{
				Name:        "test-agent",
				AcceptsFrom: []string{}, // Now expect empty slice instead of nil
				HandoffTo:   []string{"target-agent"},
				LineNumbers: map[string]int{
					"handoff_to": 3,
				},
			},
		},
		{
			name: "agent with accepts_from list",
			content: `---
name: middle-agent
accepts_from: 
  - source-agent-1
  - source-agent-2
handoff_to: "sink-agent"
---

# Middle Agent`,
			expected: Agent{
				Name:        "middle-agent",
				AcceptsFrom: []string{"source-agent-1", "source-agent-2"},
				HandoffTo:   []string{"sink-agent"},
				LineNumbers: map[string]int{
					"handoff_to": 6,
				},
			},
		},
		{
			name: "terminal agent with null handoff",
			content: `---
name: terminal-agent
accepts_from: ["source-agent"]
handoff_to: null
---`,
			expected: Agent{
				Name:        "terminal-agent",
				AcceptsFrom: []string{"source-agent"},
				HandoffTo:   []string{},
				LineNumbers: map[string]int{
					"handoff_to": 4,
				},
			},
		},
		{
			name: "agent with upstream/downstream syntax",
			content: `---
name: workflow-agent
---

## Collaboration
upstream: source-agent
downstream: target-agent`,
			expected: Agent{
				Name:        "workflow-agent",
				AcceptsFrom: []string{"source-agent"},
				HandoffTo:   []string{"target-agent"},
				LineNumbers: map[string]int{
					"upstream":   6,
					"downstream": 7,
				},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create temporary file
			tmpFile, err := ioutil.TempFile("", "agent_*.md")
			require.NoError(t, err)
			defer os.Remove(tmpFile.Name())

			// Write content
			_, err = tmpFile.WriteString(tt.content)
			require.NoError(t, err)
			tmpFile.Close()

			// Parse the file
			agent, err := parseAgentFile(tmpFile.Name())

			if tt.expectError {
				assert.Error(t, err)
				return
			}

			require.NoError(t, err)
			assert.Equal(t, tt.expected.Name, agent.Name)
			assert.Equal(t, tt.expected.AcceptsFrom, agent.AcceptsFrom)
			assert.Equal(t, tt.expected.HandoffTo, agent.HandoffTo)
			
			// Check line numbers for important fields
			for key, expectedLine := range tt.expected.LineNumbers {
				if actualLine, exists := agent.LineNumbers[key]; exists {
					assert.Equal(t, expectedLine, actualLine, "Line number mismatch for %s", key)
				}
			}
		})
	}
}

func TestParseAgentList(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected []string
	}{
		{
			name:     "single agent",
			input:    "agent-1",
			expected: []string{"agent-1"},
		},
		{
			name:     "comma separated",
			input:    "agent-1, agent-2, agent-3",
			expected: []string{"agent-1", "agent-2", "agent-3"},
		},
		{
			name:     "bracket notation",
			input:    "[agent-1, agent-2]",
			expected: []string{"agent-1", "agent-2"},
		},
		{
			name:     "quoted list",
			input:    `"agent-1, agent-2"`,
			expected: []string{"agent-1", "agent-2"},
		},
		{
			name:     "with null values",
			input:    "agent-1, null, agent-2",
			expected: []string{"agent-1", "agent-2"},
		},
		{
			name:     "empty input",
			input:    "",
			expected: []string{},
		},
		{
			name:     "only null",
			input:    "null",
			expected: []string{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := parseAgentList(tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestDetectCycles(t *testing.T) {
	tests := []struct {
		name           string
		adjacency      map[string][]string
		expectCycles   bool
		expectedCycles [][]string
	}{
		{
			name: "no cycles - linear chain",
			adjacency: map[string][]string{
				"A": {"B"},
				"B": {"C"},
				"C": {},
			},
			expectCycles: false,
		},
		{
			name: "simple cycle",
			adjacency: map[string][]string{
				"A": {"B"},
				"B": {"C"},
				"C": {"A"},
			},
			expectCycles: true,
			expectedCycles: [][]string{
				{"A", "B", "C"},
			},
		},
		{
			name: "self loop",
			adjacency: map[string][]string{
				"A": {"A"},
			},
			expectCycles: true,
		},
		{
			name: "complex graph with cycle",
			adjacency: map[string][]string{
				"A": {"B", "C"},
				"B": {"D"},
				"C": {"D"},
				"D": {"E"},
				"E": {"B"},
			},
			expectCycles: true,
		},
		{
			name: "DAG with diamond pattern",
			adjacency: map[string][]string{
				"A": {"B", "C"},
				"B": {"D"},
				"C": {"D"},
				"D": {},
			},
			expectCycles: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create a minimal graph structure
			graph := &Graph{
				Agents:    make(map[string]*Agent),
				Adjacency: tt.adjacency,
			}

			// Create agent entries for all nodes
			for node := range tt.adjacency {
				graph.Agents[node] = &Agent{Name: node}
			}
			for _, neighbors := range tt.adjacency {
				for _, neighbor := range neighbors {
					if _, exists := graph.Agents[neighbor]; !exists {
						graph.Agents[neighbor] = &Agent{Name: neighbor}
					}
				}
			}

			cycles := detectCycles(graph)

			if tt.expectCycles {
				assert.NotEmpty(t, cycles, "Expected to find cycles but found none")
			} else {
				assert.Empty(t, cycles, "Expected no cycles but found: %v", cycles)
			}

			if tt.expectedCycles != nil {
				assert.Len(t, cycles, len(tt.expectedCycles))
			}
		})
	}
}

func TestValidateDAG(t *testing.T) {
	tests := []struct {
		name           string
		agents         map[string]*Agent
		adjacency      map[string][]string
		expectedValid  bool
		expectedCycles int
		expectedBroken int
		expectedSources []string
		expectedSinks   []string
	}{
		{
			name: "valid DAG",
			agents: map[string]*Agent{
				"nephio-infrastructure-agent": {
					Name:      "nephio-infrastructure-agent",
					HandoffTo: []string{"config-agent"},
				},
				"config-agent": {
					Name:        "config-agent",
					AcceptsFrom: []string{"nephio-infrastructure-agent"},
					HandoffTo:   []string{"testing-validation-agent"},
				},
				"testing-validation-agent": {
					Name:        "testing-validation-agent",
					AcceptsFrom: []string{"config-agent"},
				},
			},
			adjacency: map[string][]string{
				"nephio-infrastructure-agent": {"config-agent"},
				"config-agent":                {"testing-validation-agent"},
				"testing-validation-agent":    {},
			},
			expectedValid:   true,
			expectedSources: []string{"nephio-infrastructure-agent"},
			expectedSinks:   []string{"testing-validation-agent"},
		},
		{
			name: "DAG with broken edge",
			agents: map[string]*Agent{
				"agent-a": {
					Name:      "agent-a",
					HandoffTo: []string{"nonexistent-agent"},
				},
			},
			adjacency: map[string][]string{
				"agent-a": {"nonexistent-agent"},
			},
			expectedValid:  false,
			expectedBroken: 1,
		},
		{
			name: "DAG with cycle",
			agents: map[string]*Agent{
				"agent-a": {Name: "agent-a", HandoffTo: []string{"agent-b"}},
				"agent-b": {Name: "agent-b", HandoffTo: []string{"agent-a"}},
			},
			adjacency: map[string][]string{
				"agent-a": {"agent-b"},
				"agent-b": {"agent-a"},
			},
			expectedValid:  false,
			expectedCycles: 1,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			graph := &Graph{
				Agents:    tt.agents,
				Adjacency: tt.adjacency,
			}

			result := validateDAG(graph)

			assert.Equal(t, tt.expectedValid, result.IsValid)
			assert.Len(t, result.Cycles, tt.expectedCycles)
			assert.Len(t, result.BrokenEdges, tt.expectedBroken)

			if tt.expectedSources != nil {
				assert.ElementsMatch(t, tt.expectedSources, result.SourceAgents)
			}
			if tt.expectedSinks != nil {
				assert.ElementsMatch(t, tt.expectedSinks, result.SinkAgents)
			}
		})
	}
}

func TestBuildGraph(t *testing.T) {
	// Create a temporary directory with test agent files
	tmpDir, err := ioutil.TempDir("", "agents_test_")
	require.NoError(t, err)
	defer os.RemoveAll(tmpDir)

	// Create test agent files
	testAgents := map[string]string{
		"source-agent.md": `---
name: source-agent
handoff_to: "middle-agent"
---`,
		"middle-agent.md": `---
name: middle-agent
accepts_from: ["source-agent"]
handoff_to: "sink-agent"
---`,
		"sink-agent.md": `---
name: sink-agent
accepts_from: ["middle-agent"]
handoff_to: null
---`,
	}

	for filename, content := range testAgents {
		err := ioutil.WriteFile(filepath.Join(tmpDir, filename), []byte(content), 0644)
		require.NoError(t, err)
	}

	// Build the graph
	graph, err := buildGraph(tmpDir)
	require.NoError(t, err)

	// Verify the graph structure
	assert.Len(t, graph.Agents, 3)
	assert.Contains(t, graph.Agents, "source-agent")
	assert.Contains(t, graph.Agents, "middle-agent")
	assert.Contains(t, graph.Agents, "sink-agent")

	// Check adjacency
	assert.Equal(t, []string{"middle-agent"}, graph.Adjacency["source-agent"])
	assert.Equal(t, []string{"sink-agent"}, graph.Adjacency["middle-agent"])
	assert.Empty(t, graph.Adjacency["sink-agent"])
}

func TestGenerateMarkdownReport(t *testing.T) {
	// Create test data
	graph := &Graph{
		Agents: map[string]*Agent{
			"agent-a": {Name: "agent-a", File: "agents/agent-a.md", HandoffTo: []string{"agent-b"}},
			"agent-b": {Name: "agent-b", File: "agents/agent-b.md", AcceptsFrom: []string{"agent-a"}},
		},
		Adjacency: map[string][]string{
			"agent-a": {"agent-b"},
			"agent-b": {},
		},
	}

	result := ValidationResult{
		IsValid:      true,
		Cycles:       [][]string{},
		BrokenEdges:  []BrokenEdge{},
		SourceAgents: []string{"agent-a"},
		SinkAgents:   []string{"agent-b"},
		Warnings:     []string{},
	}

	// Create temporary output file
	tmpFile, err := ioutil.TempFile("", "report_*.md")
	require.NoError(t, err)
	defer os.Remove(tmpFile.Name())
	tmpFile.Close()

	// Generate report
	err = generateMarkdownReport(graph, result, tmpFile.Name())
	require.NoError(t, err)

	// Read and verify report content
	content, err := ioutil.ReadFile(tmpFile.Name())
	require.NoError(t, err)

	reportContent := string(content)
	assert.Contains(t, reportContent, "# Agent Collaboration DAG Report")
	assert.Contains(t, reportContent, "✅ **PASSED**")
	assert.Contains(t, reportContent, "Total Agents: 2")
	assert.Contains(t, reportContent, "agent-a")
	assert.Contains(t, reportContent, "agent-b")
}

func TestGenerateDOTFile(t *testing.T) {
	// Create test data
	graph := &Graph{
		Agents: map[string]*Agent{
			"source": {Name: "source", HandoffTo: []string{"sink"}},
			"sink":   {Name: "sink", AcceptsFrom: []string{"source"}},
		},
		Adjacency: map[string][]string{
			"source": {"sink"},
			"sink":   {},
		},
	}

	result := ValidationResult{
		IsValid:      true,
		SourceAgents: []string{"source"},
		SinkAgents:   []string{"sink"},
		BrokenEdges:  []BrokenEdge{},
	}

	// Create temporary output file
	tmpFile, err := ioutil.TempFile("", "graph_*.dot")
	require.NoError(t, err)
	defer os.Remove(tmpFile.Name())
	tmpFile.Close()

	// Generate DOT file
	err = generateDOTFile(graph, result, tmpFile.Name())
	require.NoError(t, err)

	// Read and verify DOT content
	content, err := ioutil.ReadFile(tmpFile.Name())
	require.NoError(t, err)

	dotContent := string(content)
	assert.Contains(t, dotContent, "digraph AgentCollaboration")
	assert.Contains(t, dotContent, `"source" -> "sink"`)
	assert.Contains(t, dotContent, "lightblue")
	assert.Contains(t, dotContent, "lightcoral")
}

func TestSanitizeForMermaid(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"simple-name", "simple_name"},
		{"complex-agent-name", "complex_agent_name"},
		{"no_hyphens", "no_hyphens"},
		{"", ""},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			result := sanitizeForMermaid(tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestFormatAgentList(t *testing.T) {
	tests := []struct {
		input    []string
		expected string
	}{
		{[]string{}, "*None*"},
		{[]string{"agent-1"}, "agent-1"},
		{[]string{"agent-1", "agent-2"}, "agent-1, agent-2"},
		{[]string{"a", "b", "c"}, "a, b, c"},
	}

	for _, tt := range tests {
		t.Run(fmt.Sprintf("%v", tt.input), func(t *testing.T) {
			result := formatAgentList(tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestDeduplicate(t *testing.T) {
	tests := []struct {
		input    []string
		expected []string
	}{
		{[]string{}, []string{}},
		{[]string{"a"}, []string{"a"}},
		{[]string{"a", "b", "a"}, []string{"a", "b"}},
		{[]string{"a", "a", "a"}, []string{"a"}},
		{[]string{"a", "b", "c", "b", "a"}, []string{"a", "b", "c"}},
	}

	for _, tt := range tests {
		t.Run(fmt.Sprintf("%v", tt.input), func(t *testing.T) {
			result := deduplicate(tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}

// Benchmark tests
func BenchmarkParseAgentFile(b *testing.B) {
	content := `---
name: benchmark-agent
accepts_from: 
  - source-1
  - source-2
  - source-3
handoff_to: "target-agent"
---

# Benchmark Agent
This is a benchmark test agent with some content.

## Features
- Feature 1
- Feature 2
- Feature 3

## Collaboration
upstream: source-agent
downstream: target-agent
`

	// Create temporary file
	tmpFile, err := ioutil.TempFile("", "benchmark_*.md")
	if err != nil {
		b.Fatal(err)
	}
	defer os.Remove(tmpFile.Name())

	_, err = tmpFile.WriteString(content)
	if err != nil {
		b.Fatal(err)
	}
	tmpFile.Close()

	b.ResetTimer()
	b.Run("ParseAgentFile", func(b *testing.B) {
		for i := 0; i < b.N; i++ {
			_, err := parseAgentFile(tmpFile.Name())
			if err != nil {
				b.Fatal(err)
			}
		}
	})
}

func BenchmarkDetectCycles(b *testing.B) {
	// Create various graph sizes for benchmarking
	sizes := []int{10, 50, 100, 500}

	for _, size := range sizes {
		b.Run(fmt.Sprintf("size_%d", size), func(b *testing.B) {
			// Create a linear chain (no cycles)
			graph := &Graph{
				Agents:    make(map[string]*Agent),
				Adjacency: make(map[string][]string),
			}

			for i := 0; i < size; i++ {
				nodeName := fmt.Sprintf("node_%d", i)
				graph.Agents[nodeName] = &Agent{Name: nodeName}
				if i < size-1 {
					nextNode := fmt.Sprintf("node_%d", i+1)
					graph.Adjacency[nodeName] = []string{nextNode}
				} else {
					graph.Adjacency[nodeName] = []string{}
				}
			}

			b.ResetTimer()
			for i := 0; i < b.N; i++ {
				_ = detectCycles(graph)
			}
		})
	}
}

func BenchmarkBuildGraph(b *testing.B) {
	// Create a temporary directory with multiple agent files
	tmpDir, err := ioutil.TempDir("", "benchmark_agents_")
	if err != nil {
		b.Fatal(err)
	}
	defer os.RemoveAll(tmpDir)

	// Create various numbers of agent files
	agentCounts := []int{5, 10, 25, 50}

	for _, count := range agentCounts {
		// Create agent files
		for i := 0; i < count; i++ {
			content := fmt.Sprintf(`---
name: agent-%d
accepts_from: 
  - agent-%d
handoff_to: "agent-%d"
---

# Agent %d
Some content here.`, i, (i+count-1)%count, (i+1)%count, i)

			filename := fmt.Sprintf("agent-%d.md", i)
			err := ioutil.WriteFile(filepath.Join(tmpDir, filename), []byte(content), 0644)
			if err != nil {
				b.Fatal(err)
			}
		}

		b.Run(fmt.Sprintf("agents_%d", count), func(b *testing.B) {
			for i := 0; i < b.N; i++ {
				_, err := buildGraph(tmpDir)
				if err != nil {
					b.Fatal(err)
				}
			}
		})

		// Clean up for next iteration
		files, _ := filepath.Glob(filepath.Join(tmpDir, "*.md"))
		for _, file := range files {
			os.Remove(file)
		}
	}
}

func BenchmarkValidateDAG(b *testing.B) {
	// Create test graphs of various sizes
	sizes := []int{10, 25, 50, 100}

	for _, size := range sizes {
		b.Run(fmt.Sprintf("validate_%d_agents", size), func(b *testing.B) {
			// Create a valid DAG with multiple paths
			graph := &Graph{
				Agents:    make(map[string]*Agent),
				Adjacency: make(map[string][]string),
			}

			// Create a more complex DAG structure
			for i := 0; i < size; i++ {
				nodeName := fmt.Sprintf("agent_%d", i)
				agent := &Agent{
					Name:        nodeName,
					File:        fmt.Sprintf("agents/%s.md", nodeName),
					AcceptsFrom: []string{},
					HandoffTo:   []string{},
					LineNumbers: make(map[string]int),
				}

				// Create connections to next 2-3 nodes (if they exist)
				var targets []string
				for j := 1; j <= 3 && i+j < size; j++ {
					target := fmt.Sprintf("agent_%d", i+j)
					targets = append(targets, target)
				}

				agent.HandoffTo = targets
				graph.Agents[nodeName] = agent
				graph.Adjacency[nodeName] = targets
			}

			b.ResetTimer()
			for i := 0; i < b.N; i++ {
				_ = validateDAG(graph)
			}
		})
	}
}

// Test helpers and edge cases
func TestEdgeCases(t *testing.T) {
	t.Run("empty directory", func(t *testing.T) {
		tmpDir, err := ioutil.TempDir("", "empty_agents_")
		require.NoError(t, err)
		defer os.RemoveAll(tmpDir)

		graph, err := buildGraph(tmpDir)
		require.NoError(t, err)
		assert.Empty(t, graph.Agents)
		assert.Empty(t, graph.Adjacency)
	})

	t.Run("malformed agent file", func(t *testing.T) {
		tmpDir, err := ioutil.TempDir("", "malformed_agents_")
		require.NoError(t, err)
		defer os.RemoveAll(tmpDir)

		// Create malformed file
		malformedContent := `this is not valid yaml
name: broken-agent
handoff_to: target`

		err = ioutil.WriteFile(filepath.Join(tmpDir, "broken.md"), []byte(malformedContent), 0644)
		require.NoError(t, err)

		// Should handle gracefully
		graph, err := buildGraph(tmpDir)
		require.NoError(t, err)
		// Might have parsed some parts or skipped the file
		assert.NotNil(t, graph)
	})

	t.Run("agent with complex handoff patterns", func(t *testing.T) {
		content := `---
name: complex-agent
handoff_to: "agent-1, agent-2; agent-3|agent-4"
accepts_from: ["source-1", "source-2,source-3"]
---`

		tmpFile, err := ioutil.TempFile("", "complex_*.md")
		require.NoError(t, err)
		defer os.Remove(tmpFile.Name())

		_, err = tmpFile.WriteString(content)
		require.NoError(t, err)
		tmpFile.Close()

		agent, err := parseAgentFile(tmpFile.Name())
		require.NoError(t, err)

		// Should handle complex delimiters
		assert.Equal(t, "complex-agent", agent.Name)
		assert.NotEmpty(t, agent.HandoffTo)
		assert.NotEmpty(t, agent.AcceptsFrom)
	})
}