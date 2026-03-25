const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const agentCronService = require('../agents/agentCron');
const stepfunAgent = require('../agents/stepfunAgent');

/**
 * @route   GET /api/agents/test
 * @desc    Test StepFun agent with a simple prompt
 * @access  Private (Admin/User)
 */
router.get('/test', protect, async (req, res) => {
    try {
        const prompt = "Hello, who are you? Please introduce yourself briefly.";
        const response = await stepfunAgent.generateResponse(prompt);

        res.json({
            success: true,
            prompt,
            response,
            agent: 'StepFun Step 3.5 Flash',
            model: process.env.STEPFUN_MODEL
        });
    } catch (error) {
        console.error('Agent test error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @route   GET /api/agents/public-test
 * @desc    Public test endpoint for StepFun agent (no auth required)
 * @access  Public
 */
router.get('/public-test', async (req, res) => {
    try {
        const prompt = "Hello, who are you? Please introduce yourself briefly.";
        const response = await stepfunAgent.generateResponse(prompt);

        res.json({
            success: true,
            prompt,
            response,
            agent: 'StepFun Step 3.5 Flash',
            model: process.env.STEPFUN_MODEL,
            note: 'This is a public test endpoint'
        });
    } catch (error) {
        console.error('Agent public test error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @route   POST /api/agents/trigger
 * @desc    Manually trigger a specific background agent
 * @access  Private (Admin)
 */
router.post('/trigger', protect, async (req, res) => {
    try {
        const { agent } = req.body;

        if (!agent) {
            return res.status(400).json({
                success: false,
                message: 'Agent name is required. Options: invoiceAnalysis, paymentPrediction, communicationOptimization, weeklyInsights'
            });
        }

        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only admin can trigger agents manually'
            });
        }

        const result = await agentCronService.triggerAgent(agent);

        res.json({
            success: true,
            message: `Agent '${agent}' triggered successfully`,
            result: typeof result === 'string' ? result.substring(0, 200) + '...' : result
        });
    } catch (error) {
        console.error('Agent trigger error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @route   GET /api/agents/status
 * @desc    Get status of background agents
 * @access  Private
 */
router.get('/status', protect, (req, res) => {
    res.json({
        success: true,
        agents: {
            stepfun: {
                initialized: stepfunAgent.initialized,
                model: process.env.STEPFUN_MODEL,
                apiConfigured: !!process.env.STEPFUN_API_KEY && process.env.STEPFUN_API_KEY !== 'your_stepfun_api_key_here'
            },
            cron: {
                jobs: agentCronService.jobs.length,
                enabled: process.env.ENABLE_BACKGROUND_AGENTS === 'true'
            }
        },
        schedules: [
            { name: 'Daily Invoice Analysis', schedule: '0 2 * * * (2 AM daily)' },
            { name: 'Payment Prediction Updates', schedule: '0 */6 * * * (every 6 hours)' },
            { name: 'Customer Communication Optimization', schedule: '0 10 * * * (10 AM daily)' },
            { name: 'Weekly Business Insights', schedule: '0 3 * * 1 (3 AM every Monday)' }
        ]
    });
});

/**
 * @route   GET /api/agents/public-status
 * @desc    Public status endpoint for background agents (no auth required)
 * @access  Public
 */
router.get('/public-status', (req, res) => {
    res.json({
        success: true,
        enabled: process.env.ENABLE_BACKGROUND_AGENTS === 'true',
        model: process.env.STEPFUN_MODEL,
        agents: [
            { name: 'Daily Invoice Analysis', schedule: 'Daily at 2:00 AM', description: 'Analyzes invoice patterns and trends' },
            { name: 'Payment Prediction Updates', schedule: 'Every 6 hours', description: 'Updates payment probability predictions' },
            { name: 'Customer Communication Optimization', schedule: 'Daily at 10:00 AM', description: 'Optimizes customer communication strategies' },
            { name: 'Weekly Business Insights', schedule: 'Weekly on Monday at 3:00 AM', description: 'Generates weekly business insights report' }
        ],
        note: 'This is a public status endpoint. For detailed status, use the authenticated /status endpoint.'
    });
});

/**
 * @route   POST /api/agents/public-prompt
 * @desc    Send a custom prompt to StepFun agent (no auth required)
 * @access  Public
 */
router.post('/public-prompt', async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({
                success: false,
                message: 'Prompt is required'
            });
        }

        const response = await stepfunAgent.generateResponse(prompt);

        res.json({
            success: true,
            prompt,
            response,
            agent: 'StepFun Step 3.5 Flash',
            model: process.env.STEPFUN_MODEL,
            note: 'This is a public endpoint for testing custom prompts'
        });
    } catch (error) {
        console.error('Agent public prompt error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;