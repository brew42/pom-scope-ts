import { describe, it, expect } from 'vitest';
import { parsePom, formatDepsTable, Dep } from '../src/lib';

const header =
  'GROUP                          ARTIFACT                       VERSION              SCOPE      TYPE     CLASSIFIER';

describe('parsePom', () => {
  it('parses a single dependency with explicit scope', () => {
    const xml = `
      <project>
        <groupId>com.example</groupId>
        <artifactId>demo</artifactId>
        <version>1.0.0</version>
        <dependencies>
          <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter</artifactId>
            <version>5.10.0</version>
            <scope>test</scope>
          </dependency>
        </dependencies>
      </project>`;
    const deps = parsePom(xml);
    expect(deps).toEqual<Dep[]>([
      {
        groupId: 'org.junit.jupiter',
        artifactId: 'junit-jupiter',
        version: '5.10.0',
        scope: 'test',
        type: 'jar',
        classifier: '',
      },
    ]);
  });

  it('defaults scope to compile when omitted', () => {
    const xml = `
      <project>
        <dependencies>
          <dependency>
            <groupId>org.slf4j</groupId>
            <artifactId>slf4j-api</artifactId>
            <version>2.0.13</version>
          </dependency>
        </dependencies>
      </project>`;
    const deps = parsePom(xml);
    expect(deps[0].scope).toBe('compile');
  });

  it('resolves ${properties} and project.* fallbacks', () => {
    const xml = `
      <project>
        <groupId>com.acme</groupId>
        <artifactId>app</artifactId>
        <version>3.2.1</version>
        <properties>
          <junit.version>5.10.2</junit.version>
          <log4j.group>org.apache.logging.log4j</log4j.group>
        </properties>
        <dependencies>
          <dependency>
            <groupId>\${log4j.group}</groupId>
            <artifactId>log4j-api</artifactId>
            <version>\${project.version}</version>
          </dependency>
          <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter</artifactId>
            <version>\${junit.version}</version>
            <scope>test</scope>
          </dependency>
        </dependencies>
      </project>`;
    const deps = parsePom(xml);
    expect(deps[0]).toMatchObject({
      groupId: 'org.apache.logging.log4j',
      version: '3.2.1',
      scope: 'compile',
    });
    expect(deps[1]).toMatchObject({
      version: '5.10.2',
      scope: 'test',
    });
  });

  it('handles single or multiple dependency nodes', () => {
    const xmlSingle = `
      <project>
        <dependencies>
          <dependency><groupId>a</groupId><artifactId>b</artifactId><version>1</version></dependency>
        </dependencies>
      </project>`;
    const xmlMulti = `
      <project>
        <dependencies>
          <dependency><groupId>a</groupId><artifactId>b</artifactId><version>1</version></dependency>
          <dependency><groupId>c</groupId><artifactId>d</artifactId><version>2</version><scope>runtime</scope></dependency>
        </dependencies>
      </project>`;
    expect(parsePom(xmlSingle)).toHaveLength(1);
    expect(parsePom(xmlMulti)).toHaveLength(2);
  });

  it('applies default type "jar" and empty classifier', () => {
    const xml = `
      <project>
        <dependencies>
          <dependency>
            <groupId>x</groupId><artifactId>y</artifactId><version>1</version>
          </dependency>
        </dependencies>
      </project>`;
    const [dep] = parsePom(xml);
    expect(dep.type).toBe('jar');
    expect(dep.classifier).toBe('');
  });

  it('leaves unresolved placeholders intact', () => {
    const xml = `
      <project>
        <dependencies>
          <dependency>
            <groupId>\${unknown.group}</groupId>
            <artifactId>artifact</artifactId>
            <version>\${unknown.version}</version>
          </dependency>
        </dependencies>
      </project>`;
    const [dep] = parsePom(xml);
    expect(dep.groupId).toBe('${unknown.group}');
    expect(dep.version).toBe('${unknown.version}');
  });
});

describe('formatDepsTable', () => {
  it('renders a simple table with headers', () => {
    const deps: Dep[] = [
      {
        groupId: 'g',
        artifactId: 'a',
        version: '1.2.3',
        scope: 'compile',
        type: 'jar',
        classifier: '',
      },
    ];
    const table = formatDepsTable(deps);
    expect(table.split('\n')[0]).toBe(header);
    expect(table).toContain('g');
    expect(table).toContain('a');
    expect(table).toContain('1.2.3');
    expect(table).toContain('compile');
  });
});
