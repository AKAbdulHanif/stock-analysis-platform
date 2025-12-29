// Accessibility testing script using axe-core
// This script will be injected into the browser to run accessibility tests

(async function() {
  // Load axe-core from CDN
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.11.0/axe.min.js';
  document.head.appendChild(script);
  
  // Wait for axe to load
  await new Promise(resolve => {
    script.onload = resolve;
  });
  
  // Run axe accessibility tests
  const results = await axe.run();
  
  // Format results
  const summary = {
    url: window.location.href,
    timestamp: new Date().toISOString(),
    violations: results.violations.length,
    passes: results.passes.length,
    incomplete: results.incomplete.length,
    inapplicable: results.inapplicable.length,
    violationDetails: results.violations.map(v => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      help: v.help,
      helpUrl: v.helpUrl,
      nodes: v.nodes.length,
      tags: v.tags,
      examples: v.nodes.slice(0, 3).map(n => ({
        html: n.html,
        target: n.target,
        failureSummary: n.failureSummary
      }))
    }))
  };
  
  return summary;
})();
