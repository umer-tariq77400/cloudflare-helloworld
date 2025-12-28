import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect, vi } from 'vitest';
import worker from '../src';

describe('Uptime Monitor Worker', () => {
	describe('fetch handler', () => {
		it('responds with schedule message (unit style)', async () => {
			const request = new Request('http://example.com');
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			
			expect(response.status).toBe(200);
			expect(await response.text()).toBe('This worker runs on a schedule. Check the logs! Updated 2');
		});

		it('responds with schedule message (integration style)', async () => {
			const response = await SELF.fetch('http://example.com');
			
			expect(response.status).toBe(200);
			expect(await response.text()).toBe('This worker runs on a schedule. Check the logs! Updated 2');
		});

		it('handles different HTTP methods', async () => {
			const methods = ['GET', 'POST', 'PUT', 'DELETE'];
			
			for (const method of methods) {
				const request = new Request('http://example.com', { method });
				const ctx = createExecutionContext();
				const response = await worker.fetch(request, env, ctx);
				await waitOnExecutionContext(ctx);
				
				expect(response.status).toBe(200);
			}
		});
	});

	describe('scheduled handler', () => {
		it('checks website uptime successfully', async () => {
			// Mock successful fetch
			global.fetch = vi.fn().mockResolvedValue({
				status: 200,
			});

			const ctx = createExecutionContext();
			const event = { scheduledTime: Date.now(), cron: '*/10 * * * *' };
			
			await worker.scheduled(event, env, ctx);
			await waitOnExecutionContext(ctx);

			expect(global.fetch).toHaveBeenCalledWith('https://www.google.com');
		});

		it('detects website downtime', async () => {
			// Mock failed fetch
			global.fetch = vi.fn().mockResolvedValue({
				status: 500,
			});

			const ctx = createExecutionContext();
			const event = { scheduledTime: Date.now(), cron: '*/10 * * * *' };
			
			await worker.scheduled(event, env, ctx);
			await waitOnExecutionContext(ctx);

			expect(global.fetch).toHaveBeenCalledWith('https://www.google.com');
		});

		it('handles various HTTP status codes', async () => {
			const statusCodes = [200, 404, 500, 503];
			
			for (const status of statusCodes) {
				global.fetch = vi.fn().mockResolvedValue({ status });

				const ctx = createExecutionContext();
				const event = { scheduledTime: Date.now(), cron: '*/10 * * * *' };
				
				await worker.scheduled(event, env, ctx);
				await waitOnExecutionContext(ctx);

				expect(global.fetch).toHaveBeenCalledWith('https://www.google.com');
			}
		});

		it('handles fetch errors gracefully', async () => {
			// Mock network error
			global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

			const ctx = createExecutionContext();
			const event = { scheduledTime: Date.now(), cron: '*/10 * * * *' };
			
			await expect(worker.scheduled(event, env, ctx)).rejects.toThrow('Network error');
		});
	});
});
