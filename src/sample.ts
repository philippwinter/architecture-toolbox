export const SAMPLE_YAML = `# Capability Map Studio – Startbeispiel
version: 1
map:
  id: enterprise-capabilities
  name: Enterprise Capability Map
  description: Beispiel für gemischte Layouts, Metadaten und Vererbung
  theme:
    defaultColor: "#DCE8F5"
  capabilities:
    - type: group
      id: management-group
      name: Management Capabilities
      visualization:
        backgroundColor: "#E9F1F8"
      layout:
        direction: horizontal
        trackWeight: 1.15
      capabilities:
        - id: strategy
          name: Strategy
          description: Defines direction and enterprise priorities.
          owner: Corporate Development
          responsibilities: [Strategic planning, Portfolio governance]
          tags: [management, core]
          visualization:
            color: "#D7E9F7"
            icon: compass
          layout:
            direction: horizontal
            weight: 2
            trackWeight: 1
          metadata:
            maturity: established
            criticality: high

        - id: governance
          name: Governance
          owner: Executive Office
          tags: [management]
          visualization:
            icon: shield
          layout:
            direction: horizontal
          metadata:
            maturity: managed

        - id: innovation
          name: Innovation
          owner: Product
          visualization:
            icon: lightbulb
          layout:
            direction: horizontal

    - id: customer
      name: Customer
      description: Understands, wins and serves customers.
      owner: Commercial
      tags: [customer, core]
      visualization:
        color: "#F8DFC0"
        icon: users
      layout:
        direction: vertical
        weight: 1.2
      children:
        - id: customer-insights
          name: Customer Insights
          description: Turns customer signals into decisions.
          visualization:
            icon: chart
          layout:
            direction: horizontal
            weight: 1
            trackWeight: 1
        - id: sales
          name: Sales
          visualization:
            icon: handshake
          layout:
            direction: horizontal
            weight: 1.4
        - id: service
          name: Customer Service
          visualization:
            icon: users
          layout:
            direction: horizontal
            weight: 1

    - id: operations
      name: Operations
      description: Delivers products and services reliably.
      owner: COO
      tags: [operations, core]
      visualization:
        color: "#DDECCF"
        icon: factory
      layout:
        direction: vertical
        weight: 1.35
      children:
        - id: supply-chain
          name: Supply Chain
          visualization:
            icon: workflow
        - id: production
          name: Production
          visualization:
            icon: settings
        - id: quality
          name: Quality Management
          visualization:
            icon: gauge

    - type: group
      id: enabler-group
      name: Enabling Capabilities
      visualization:
        backgroundColor: "#F1EAF7"
      layout:
        direction: vertical
        weight: 1.1
      capabilities:
        - id: technology
          name: Technology
          owner: CIO
          tags: [enabler]
          visualization:
            color: "#E5DDF4"
            icon: layers
          layout:
            direction: horizontal
            weight: 1.2
            trackWeight: 1
          metadata:
            criticality: high

        - id: people
          name: People & Organisation
          owner: People
          tags: [enabler]
          visualization:
            color: "#F2DDE7"
            icon: building
          layout:
            direction: horizontal
            weight: 1
`;
