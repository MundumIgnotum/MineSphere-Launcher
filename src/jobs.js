'use strict';

const { randomId, formatBytes } = require('./util');

class Job {
  constructor(type, title) {
    this.id = randomId(8);
    this.type = type;
    this.title = title || type;
    this.status = 'running';
    this.stage = 'A iniciar';
    this.message = '';
    this.detail = '';
    this.filesTotal = 0;
    this.filesDone = 0;
    this.bytesDownloaded = 0;
    this.bytesTotal = 0;
    this.result = null;
    this.error = null;
    this.warnings = [];
    this.createdAt = Date.now();
    this.startedAt = Date.now();
    this.finishedAt = null;
  }

  setStage(stage, message = '') {
    this.stage = stage;
    if (message) this.message = message;
    return this;
  }

  setMessage(message) {
    this.message = message;
    return this;
  }

  setDetail(detail) {
    this.detail = detail;
    return this;
  }

  setFiles(total) {
    this.filesTotal = Number(total) || 0;
    return this;
  }

  fileDone() {
    this.filesDone += 1;
    return this;
  }

  addSkipped(task) {
    if (task && task.size) this.bytesDownloaded += Number(task.size) || 0;
    return this;
  }

  addBytes(bytes) {
    this.bytesDownloaded += Number(bytes) || 0;
    return this;
  }

  setBytesTotal(bytes) {
    this.bytesTotal += Number(bytes) || 0;
    return this;
  }

  warn(message) {
    if (!message) return;
    this.warnings.push(String(message));
    if (this.warnings.length > 30) this.warnings.shift();
  }

  progress() {
    if (this.status !== 'running') return this.status === 'completed' ? 100 : 0;
    if (this.filesTotal > 0) return Math.max(0, Math.min(99, Math.round((this.filesDone / this.filesTotal) * 100)));
    if (this.bytesTotal > 0) return Math.max(0, Math.min(99, Math.round((this.bytesDownloaded / this.bytesTotal) * 100)));
    return null;
  }

  complete(result = null) {
    this.status = 'completed';
    this.stage = 'Concluído';
    this.result = result;
    this.finishedAt = Date.now();
    if (!this.message) this.message = 'Concluído com sucesso.';
    return this;
  }

  fail(error) {
    this.status = 'failed';
    this.stage = 'Erro';
    this.error = error instanceof Error ? error.message : String(error);
    this.finishedAt = Date.now();
    return this;
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      title: this.title,
      status: this.status,
      stage: this.stage,
      message: this.message,
      detail: this.detail,
      filesTotal: this.filesTotal,
      filesDone: this.filesDone,
      bytesDownloaded: this.bytesDownloaded,
      bytesTotal: this.bytesTotal,
      bytesDownloadedLabel: formatBytes(this.bytesDownloaded),
      bytesTotalLabel: this.bytesTotal ? formatBytes(this.bytesTotal) : '',
      progress: this.progress(),
      result: this.result,
      error: this.error,
      warnings: this.warnings,
      createdAt: this.createdAt,
      startedAt: this.startedAt,
      finishedAt: this.finishedAt,
      elapsedMs: (this.finishedAt || Date.now()) - this.startedAt,
    };
  }
}

class JobManager {
  constructor() {
    this.jobs = new Map();
    this.maxJobs = 80;
  }

  create(type, title) {
    const job = new Job(type, title);
    this.jobs.set(job.id, job);
    this.prune();
    return job;
  }

  run(type, title, work) {
    const job = this.create(type, title);
    setImmediate(async () => {
      try {
        const result = await work(job);
        job.complete(result);
      } catch (error) {
        console.error(`[job:${job.type}] ${job.title}:`, error);
        job.fail(error);
      }
    });
    return job;
  }

  get(id) {
    return this.jobs.get(id) || null;
  }

  list(activeOnly = false) {
    const list = [...this.jobs.values()].sort((a, b) => b.createdAt - a.createdAt);
    return (activeOnly ? list.filter((job) => job.status === 'running') : list).map((job) => job.toJSON());
  }

  prune() {
    if (this.jobs.size <= this.maxJobs) return;
    const finished = [...this.jobs.values()]
      .filter((job) => job.status !== 'running')
      .sort((a, b) => a.createdAt - b.createdAt);
    while (this.jobs.size > this.maxJobs && finished.length) {
      this.jobs.delete(finished.shift().id);
    }
  }
}

const jobManager = new JobManager();

module.exports = { Job, JobManager, jobManager };
