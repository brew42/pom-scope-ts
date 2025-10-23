import { XMLParser } from 'fast-xml-parser';

export type PropertiesRecord = Record<string, string | number | boolean>;

export type PomDependency = {
  groupId?: string;
  artifactId?: string;
  version?: string;
  scope?: string;
  type?: string;
  classifier?: string;
};

export type PomProject = {
  groupId?: string;
  artifactId?: string;
  version?: string;
  properties?: PropertiesRecord;
  dependencies?: { dependency?: PomDependency | PomDependency[] };
};

export type PomDoc = { project?: PomProject };

export type Dep = {
  groupId: string;
  artifactId: string;
  version: string;
  scope: string;
  type: string;
  classifier: string;
};

export function parsePom(xml: string): Dep[] {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
  const doc = parser.parse(xml) as PomDoc;

  const project = doc.project;
  if (!project) throw new Error('Not a valid pom.xml (no <project> root element found).');

  const resolveProp = makePropertyResolver(project);
  const depsNode = project.dependencies?.dependency;
  const depList: PomDependency[] = Array.isArray(depsNode) ? depsNode : depsNode ? [depsNode] : [];

  return depList.map((d) => ({
    groupId: resolveProp(d.groupId ?? ''),
    artifactId: resolveProp(d.artifactId ?? ''),
    version: resolveProp(d.version ?? ''),
    scope: (d.scope ?? 'compile').trim(),
    type: d.type ?? 'jar',
    classifier: d.classifier ?? '',
  }));
}

export function formatDepsTable(deps: Dep[]): string {
  const pad = (s: string, n: number) => String(s ?? '').padEnd(n);
  const rows = [
    `${pad('GROUP', 30)} ${pad('ARTIFACT', 30)} ${pad('VERSION', 20)} ${pad('SCOPE', 10)} ${pad('TYPE', 8)} CLASSIFIER`,
    `${'-'.repeat(30)} ${'-'.repeat(30)} ${'-'.repeat(20)} ${'-'.repeat(10)} ${'-'.repeat(8)} ${'-'.repeat(10)}`,
  ];
  deps.forEach((r) => {
    rows.push(
      `${pad(r.groupId, 30)} ${pad(r.artifactId, 30)} ${pad(r.version, 20)} ${pad(
        r.scope,
        10
      )} ${pad(r.type, 8)} ${r.classifier}`
    );
  });
  return rows.join('\n');
}

function makePropertyResolver(p: PomProject) {
  const props: PropertiesRecord = p.properties ?? {};
  return (value: unknown): string => {
    if (typeof value !== 'string') return String(value ?? '');
    return value.replace(/\$\{([^}]+)\}/g, (_, key) => {
      if (key in props) return String(props[key as keyof PropertiesRecord]);
      if (key === 'project.groupId') return p.groupId ?? '';
      if (key === 'project.version') return p.version ?? '';
      if (key === 'project.artifactId') return p.artifactId ?? '';
      return `\${${key}}`;
    });
  };
}
