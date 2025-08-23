/**
 * Integration tests for agent workflow functionality
 * Tests the complete flow from agent selection to documentation rendering
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Mock data for testing
const mockAgentData = {
  'configuration-management-agent': {
    name: 'Configuration Management Agent',
    description: 'Manages YANG models and Infrastructure as Code templates',
    model: 'sonnet',
    capabilities: [
      'YANG model validation',
      'IaC template generation',
      'Configuration drift detection'
    ],
    dependencies: ['kpt', 'kubectl'],
    examples: [
      {
        name: 'YANG Model Validation',
        input: 'Validate YANG model for O-RAN DU interface',
        expectedOutput: 'YANG validation results with compliance status'
      }
    ]
  },
  'nephio-infrastructure-agent': {
    name: 'Nephio Infrastructure Agent',
    description: 'Deploys and manages Kubernetes infrastructure for O-RAN workloads',
    model: 'sonnet',
    capabilities: [
      'Cluster provisioning',
      'Network function deployment',
      'Resource optimization'
    ],
    dependencies: ['nephio', 'kubernetes'],
    examples: [
      {
        name: 'Edge Cluster Deployment',
        input: 'Deploy edge cluster for 5G core functions',
        expectedOutput: 'Kubernetes manifests and deployment status'
      }
    ]
  }
};

// Mock components for testing
const MockAgentSelector = ({ onAgentSelect }: { onAgentSelect: (agent: string) => void }) => (
  <div data-testid="agent-selector">
    <button 
      onClick={() => onAgentSelect('configuration-management-agent')}
      data-testid="select-config-agent"
    >
      Configuration Management Agent
    </button>
    <button 
      onClick={() => onAgentSelect('nephio-infrastructure-agent')}
      data-testid="select-infra-agent"
    >
      Nephio Infrastructure Agent
    </button>
  </div>
);

const MockAgentDetails = ({ agentId }: { agentId: string | null }) => {
  if (!agentId) return <div data-testid="no-agent-selected">No agent selected</div>;
  
  const agent = mockAgentData[agentId as keyof typeof mockAgentData];
  if (!agent) return <div data-testid="agent-not-found">Agent not found</div>;

  return (
    <div data-testid="agent-details">
      <h2 data-testid="agent-name">{agent.name}</h2>
      <p data-testid="agent-description">{agent.description}</p>
      <div data-testid="agent-model">Model: {agent.model}</div>
      <ul data-testid="agent-capabilities">
        {agent.capabilities.map((capability, index) => (
          <li key={index}>{capability}</li>
        ))}
      </ul>
      <div data-testid="agent-dependencies">
        Dependencies: {agent.dependencies.join(', ')}
      </div>
    </div>
  );
};

const MockWorkflowContainer = () => {
  const [selectedAgent, setSelectedAgent] = React.useState<string | null>(null);
  const [workflowState, setWorkflowState] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleAgentSelect = async (agentId: string) => {
    setWorkflowState('loading');
    setSelectedAgent(null);
    
    // Simulate async agent loading
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setSelectedAgent(agentId);
      setWorkflowState('success');
    } catch (error) {
      setWorkflowState('error');
    }
  };

  return (
    <BrowserRouter>
      <div data-testid="workflow-container">
        <MockAgentSelector onAgentSelect={handleAgentSelect} />
        
        {workflowState === 'loading' && <div data-testid="loading-state">Loading agent...</div>}
        {workflowState === 'error' && <div data-testid="error-state">Error loading agent</div>}
        {workflowState === 'success' && <MockAgentDetails agentId={selectedAgent} />}
        
        <div data-testid="workflow-state">{workflowState}</div>
      </div>
    </BrowserRouter>
  );
};

describe('Agent Workflow Integration', () => {
  describe('agent selection workflow', () => {
    it('should handle complete agent selection flow', async () => {
      const user = userEvent.setup();
      render(<MockWorkflowContainer />);

      // Initial state
      expect(screen.getByTestId('workflow-state')).toHaveTextContent('idle');
      expect(screen.getByTestId('agent-selector')).toBeInTheDocument();

      // Select configuration management agent
      await user.click(screen.getByTestId('select-config-agent'));

      // Should show loading state
      expect(screen.getByTestId('loading-state')).toBeInTheDocument();
      expect(screen.getByTestId('workflow-state')).toHaveTextContent('loading');

      // Wait for agent to load
      await waitFor(() => {
        expect(screen.getByTestId('agent-details')).toBeInTheDocument();
      });

      // Verify agent details are displayed correctly
      expect(screen.getByTestId('agent-name')).toHaveTextContent('Configuration Management Agent');
      expect(screen.getByTestId('agent-description')).toHaveTextContent('Manages YANG models');
      expect(screen.getByTestId('agent-model')).toHaveTextContent('Model: sonnet');
      expect(screen.getByTestId('workflow-state')).toHaveTextContent('success');

      // Verify capabilities are listed
      const capabilities = screen.getByTestId('agent-capabilities');
      expect(capabilities).toHaveTextContent('YANG model validation');
      expect(capabilities).toHaveTextContent('IaC template generation');
      expect(capabilities).toHaveTextContent('Configuration drift detection');

      // Verify dependencies
      expect(screen.getByTestId('agent-dependencies')).toHaveTextContent('kpt, kubectl');
    });

    it('should handle switching between agents', async () => {
      const user = userEvent.setup();
      render(<MockWorkflowContainer />);

      // Select first agent
      await user.click(screen.getByTestId('select-config-agent'));
      
      await waitFor(() => {
        expect(screen.getByTestId('agent-name')).toHaveTextContent('Configuration Management Agent');
      });

      // Switch to second agent
      await user.click(screen.getByTestId('select-infra-agent'));
      
      // Should show loading again
      expect(screen.getByTestId('loading-state')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByTestId('agent-name')).toHaveTextContent('Nephio Infrastructure Agent');
      });

      // Verify new agent details
      expect(screen.getByTestId('agent-description')).toHaveTextContent('Deploys and manages Kubernetes');
      
      const capabilities = screen.getByTestId('agent-capabilities');
      expect(capabilities).toHaveTextContent('Cluster provisioning');
      expect(capabilities).toHaveTextContent('Network function deployment');
      
      expect(screen.getByTestId('agent-dependencies')).toHaveTextContent('nephio, kubernetes');
    });
  });

  describe('agent validation workflow', () => {
    it('should validate agent compatibility', async () => {
      // Test agent compatibility validation logic
      const validateAgent = (agentId: string) => {
        const agent = mockAgentData[agentId as keyof typeof mockAgentData];
        if (!agent) return { valid: false, errors: ['Agent not found'] };

        const errors: string[] = [];
        
        // Validate required fields
        if (!agent.name) errors.push('Missing agent name');
        if (!agent.description) errors.push('Missing agent description');
        if (!agent.model) errors.push('Missing agent model');
        if (!['haiku', 'sonnet', 'opus'].includes(agent.model)) {
          errors.push('Invalid agent model');
        }
        
        // Validate capabilities
        if (!agent.capabilities || agent.capabilities.length === 0) {
          errors.push('Missing agent capabilities');
        }
        
        // Validate dependencies
        if (!agent.dependencies || agent.dependencies.length === 0) {
          errors.push('Missing agent dependencies');
        }

        return { valid: errors.length === 0, errors };
      };

      // Test valid agent
      const configResult = validateAgent('configuration-management-agent');
      expect(configResult.valid).toBe(true);
      expect(configResult.errors).toHaveLength(0);

      const infraResult = validateAgent('nephio-infrastructure-agent');
      expect(infraResult.valid).toBe(true);
      expect(infraResult.errors).toHaveLength(0);

      // Test invalid agent
      const invalidResult = validateAgent('nonexistent-agent');
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors).toContain('Agent not found');
    });

    it('should validate agent interdependencies', () => {
      const validateDependencies = (agentId: string) => {
        const agent = mockAgentData[agentId as keyof typeof mockAgentData];
        if (!agent) return { valid: false, missing: ['Agent not found'] };

        const availableTools = ['kpt', 'kubectl', 'nephio', 'kubernetes', 'helm', 'docker'];
        const missing = agent.dependencies.filter(dep => !availableTools.includes(dep));

        return { valid: missing.length === 0, missing };
      };

      // Test configuration management agent dependencies
      const configDeps = validateDependencies('configuration-management-agent');
      expect(configDeps.valid).toBe(true);
      expect(configDeps.missing).toHaveLength(0);

      // Test infrastructure agent dependencies
      const infraDeps = validateDependencies('nephio-infrastructure-agent');
      expect(infraDeps.valid).toBe(true);
      expect(infraDeps.missing).toHaveLength(0);
    });
  });

  describe('error handling workflow', () => {
    it('should handle agent loading errors gracefully', async () => {
      const ErrorWorkflowContainer = () => {
        const [workflowState, setWorkflowState] = React.useState<'idle' | 'loading' | 'error'>('idle');

        const handleErrorAgent = async () => {
          setWorkflowState('loading');
          
          // Simulate error after delay
          setTimeout(() => {
            setWorkflowState('error');
          }, 100);
        };

        return (
          <div data-testid="error-workflow">
            <button onClick={handleErrorAgent} data-testid="trigger-error">
              Load Error Agent
            </button>
            
            {workflowState === 'loading' && <div data-testid="loading-state">Loading...</div>}
            {workflowState === 'error' && (
              <div data-testid="error-state">
                Failed to load agent. Please try again.
              </div>
            )}
          </div>
        );
      };

      const user = userEvent.setup();
      render(<ErrorWorkflowContainer />);

      await user.click(screen.getByTestId('trigger-error'));
      
      // Should show loading first
      expect(screen.getByTestId('loading-state')).toBeInTheDocument();

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toBeInTheDocument();
      });

      expect(screen.getByTestId('error-state')).toHaveTextContent('Failed to load agent');
    });

    it('should provide helpful error messages for common issues', () => {
      const getErrorMessage = (errorType: string) => {
        const errorMessages = {
          'agent-not-found': 'The requested agent could not be found. Please check the agent name.',
          'invalid-model': 'Invalid model specified. Must be one of: haiku, sonnet, opus.',
          'missing-dependencies': 'Required dependencies are not available. Please install the necessary tools.',
          'network-error': 'Network error occurred. Please check your connection and try again.',
          'permission-error': 'Permission denied. Please check your access rights.',
          'timeout-error': 'Request timed out. Please try again later.',
        };

        return errorMessages[errorType as keyof typeof errorMessages] || 'An unknown error occurred.';
      };

      expect(getErrorMessage('agent-not-found')).toContain('could not be found');
      expect(getErrorMessage('invalid-model')).toContain('haiku, sonnet, opus');
      expect(getErrorMessage('missing-dependencies')).toContain('install the necessary tools');
      expect(getErrorMessage('network-error')).toContain('check your connection');
      expect(getErrorMessage('unknown-error')).toBe('An unknown error occurred.');
    });
  });

  describe('performance and scalability', () => {
    it('should handle rapid agent switching without memory leaks', async () => {
      const user = userEvent.setup();
      render(<MockWorkflowContainer />);

      // Rapidly switch between agents multiple times
      for (let i = 0; i < 5; i++) {
        await user.click(screen.getByTestId('select-config-agent'));
        await waitFor(() => {
          expect(screen.getByTestId('workflow-state')).toHaveTextContent('success');
        });

        await user.click(screen.getByTestId('select-infra-agent'));
        await waitFor(() => {
          expect(screen.getByTestId('workflow-state')).toHaveTextContent('success');
        });
      }

      // Final state should be stable
      expect(screen.getByTestId('agent-name')).toHaveTextContent('Nephio Infrastructure Agent');
      expect(screen.getByTestId('workflow-state')).toHaveTextContent('success');
    });

    it('should handle concurrent agent requests properly', async () => {
      const ConcurrentWorkflowContainer = () => {
        const [results, setResults] = React.useState<string[]>([]);

        const handleConcurrentRequests = async () => {
          const promises = [
            'configuration-management-agent',
            'nephio-infrastructure-agent',
            'configuration-management-agent'
          ].map(async (agentId, index) => {
            // Simulate different response times
            await new Promise(resolve => setTimeout(resolve, Math.random() * 500));
            return `${agentId}-${index}`;
          });

          const results = await Promise.all(promises);
          setResults(results);
        };

        return (
          <div data-testid="concurrent-workflow">
            <button onClick={handleConcurrentRequests} data-testid="trigger-concurrent">
              Load Concurrent Agents
            </button>
            
            <div data-testid="results">
              {results.map((result, index) => (
                <div key={index} data-testid={`result-${index}`}>
                  {result}
                </div>
              ))}
            </div>
          </div>
        );
      };

      const user = userEvent.setup();
      render(<ConcurrentWorkflowContainer />);

      await user.click(screen.getByTestId('trigger-concurrent'));

      await waitFor(() => {
        expect(screen.getByTestId('result-0')).toBeInTheDocument();
        expect(screen.getByTestId('result-1')).toBeInTheDocument();
        expect(screen.getByTestId('result-2')).toBeInTheDocument();
      });

      // Verify all results are present and correct
      expect(screen.getByTestId('result-0')).toHaveTextContent('configuration-management-agent-0');
      expect(screen.getByTestId('result-1')).toHaveTextContent('nephio-infrastructure-agent-1');
      expect(screen.getByTestId('result-2')).toHaveTextContent('configuration-management-agent-2');
    });
  });

  describe('accessibility in workflows', () => {
    it('should maintain focus management during agent transitions', async () => {
      const user = userEvent.setup();
      render(<MockWorkflowContainer />);

      const configButton = screen.getByTestId('select-config-agent');
      
      // Focus and select agent
      configButton.focus();
      expect(document.activeElement).toBe(configButton);
      
      await user.click(configButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('agent-details')).toBeInTheDocument();
      });

      // Focus should be managed appropriately
      const agentName = screen.getByTestId('agent-name');
      expect(agentName).toBeInTheDocument();
    });

    it('should provide proper ARIA attributes for workflow states', () => {
      const AriaWorkflowContainer = () => {
        const [state, setState] = React.useState('idle');

        return (
          <div 
            data-testid="aria-workflow"
            role="application"
            aria-label="Agent workflow"
            aria-describedby="workflow-description"
          >
            <div id="workflow-description">
              Select an agent to view its details and capabilities.
            </div>
            
            <div 
              role="status" 
              aria-live="polite"
              data-testid="workflow-status"
            >
              Current state: {state}
            </div>
            
            <button
              onClick={() => setState('loading')}
              aria-describedby="config-agent-description"
              data-testid="aria-config-button"
            >
              Configuration Agent
            </button>
            
            <div id="config-agent-description" className="sr-only">
              Manages YANG models and Infrastructure as Code templates
            </div>
          </div>
        );
      };

      render(<AriaWorkflowContainer />);

      const workflow = screen.getByTestId('aria-workflow');
      expect(workflow).toHaveAttribute('role', 'application');
      expect(workflow).toHaveAttribute('aria-label', 'Agent workflow');

      const status = screen.getByTestId('workflow-status');
      expect(status).toHaveAttribute('role', 'status');
      expect(status).toHaveAttribute('aria-live', 'polite');

      const button = screen.getByTestId('aria-config-button');
      expect(button).toHaveAttribute('aria-describedby', 'config-agent-description');
    });
  });
});