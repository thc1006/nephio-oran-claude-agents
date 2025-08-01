# Token efficiency tracking
efficiency_metrics = {
    "nephio-infrastructure-agent": {
        "model": "haiku",
        "avg_tokens_per_task": 500,
        "max_acceptable": 1000,
        "cost_per_1k_tokens": 0.0015
    },
    "oran-network-functions-agent": {
        "model": "sonnet",
        "avg_tokens_per_task": 1500,
        "max_acceptable": 3000, 
        "cost_per_1k_tokens": 0.015
    },
    "security-compliance-agent": {
        "model": "opus",
        "avg_tokens_per_task": 3000,
        "max_acceptable": 6000,
        "cost_per_1k_tokens": 0.075
    }
}
