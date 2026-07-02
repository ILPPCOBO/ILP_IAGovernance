# Preliminary AI Governance Policy Package

Northwind Analytics


## Executive summary

This is a preliminary AI governance package for Northwind Analytics. Its AI governance readiness score is 91/100 (mature). It identifies 1 finding(s), including 0 high-priority item(s), and provides draft policies, controls and workflows. It is not legal advice and is not a final compliance review; it should be reviewed and adapted by qualified professionals before implementation.


## AI governance readiness score

91/100 — Mature

AI governance readiness score: 91/100 (mature). This indicates how structured your internal AI governance is. It is not a measure of legal compliance.


## Key findings

- [MEDIUM] Sensitive data may be entered into AI tools — Apply the stricter sensitive-data rules in this package and restrict sensitive data to approved, enterprise-grade tools.

## Internal AI-use policy


### Purpose and scope

This policy sets out how employees and contractors may use generative AI tools at Northwind Analytics. It is a preliminary, internal draft and should be reviewed and adapted by qualified professionals before implementation.


### Who the policy applies to

This policy applies to all employees, contractors, interns and third parties who use AI tools on behalf of Northwind Analytics or with company data.


### Approved AI tools

Only AI tools that appear on the company's approved-tools list, with the status and conditions stated there, may be used for company work.


### Permitted uses

Subject to the rules below, employees may use approved AI tools for low-risk productivity tasks such as drafting, summarizing, brainstorming and reformatting non-sensitive content.


### Restricted uses

Higher-risk uses are permitted only with the controls in this policy: human review, no sensitive data, and disclosure where required.

AI coding tools may be used for non-confidential code, but generated code must be reviewed before deployment and must not include secrets or proprietary source unless the tool is approved for that purpose.


### Prohibited uses

The following are prohibited: entering credentials, passwords, API keys or secrets into AI tools; using AI to produce deceptive content, impersonation or deepfakes; and presenting AI output as final professional advice without review.

Uploading confidential, client, personal or trade-secret data to public/free AI tools is prohibited unless an approved, enterprise-grade tool with suitable contractual terms is used.

AI must not be used to make final legal, medical, financial, HR or compliance decisions without qualified human judgment.

Fully automated hiring decisions and employee surveillance/scoring using AI are prohibited without explicit approval, a documented lawful basis and human oversight.


### Sensitive-data rules

Do not enter sensitive data into AI tools unless the specific tool is approved for that data type. Sensitive data includes personal data, client data, confidential information, trade secrets, source code, contracts, legal/privileged material, financial data and regulated data.


### Confidentiality rules

Treat anything entered into an AI tool as potentially disclosed outside the company. Do not enter information you would not be comfortable sharing with an external third party absent appropriate contractual protection.


### Personal-data rules

Personal data may only be processed with AI where there is a lawful basis, data-minimization is applied and the tool's terms permit such processing. When in doubt, consult the DPO or legal team.


### IP and output-use rules

AI outputs may carry intellectual-property and accuracy risks. Verify originality and rights before publishing or relying on AI-generated content, and do not assume ownership of generated material.


### Human-review requirements

A qualified person must review AI output before it is used in any external, legal, financial, employment, regulated or high-impact context. AI assists; humans remain accountable.


### Disclosure requirements

Disclose AI use where it affects others' understanding or decisions: in public-facing content, when generating synthetic media, and when AI materially informs a decision affecting a client, employee or the public.


### Security requirements

Use company-managed accounts and approved tools, keep software updated, never share login credentials, and report suspected data exposure immediately.

Tools that have not undergone a security/privacy review must not be used with any company or personal data until that review is completed.


### Vendor approval process

New AI tools and vendors must be approved before use through the vendor-approval workflow, which reviews data processing, training on data, security, retention and contractual terms.


### Incident reporting process

Report AI incidents — such as accidental upload of sensitive data, harmful or hallucinated output, or unauthorized tool use — promptly through the incident-reporting process so they can be contained and documented.


### Employee training and AI literacy

Employees must complete AI literacy training covering AI limitations, verification of outputs, confidentiality, personal data, approved tools, prohibited uses and how to report incidents.


### Enforcement and policy review

Breaches of this policy may lead to access restrictions and disciplinary measures. The policy is preliminary and will be reviewed and adapted with qualified professionals.


### Policy owner and review cadence

Policy owner: AI governance owner. This preliminary policy should be reviewed at least every 6–12 months and whenever AI use, tools or regulation change materially.


## Approved-tools list


| Tool | Status | Data allowed | Data prohibited |
| --- | --- | --- | --- |
| Microsoft Copilot | Approved | Non-sensitive business data per approval scope. | Credentials/secrets and any data outside the approval scope. |
| Claude | Approved | Non-sensitive business data per approval scope. | Credentials/secrets and any data outside the approval scope. |
| GitHub Copilot | Conditionally approved | Non-sensitive, non-confidential, public-safe content only. | Credentials/secrets and any data outside the approval scope. |


## Sensitive-data rules

- Personal data: Do not enter personal data into AI tools unless the specific tool is approved for it.
- Client/customer data: Do not enter client/customer data into AI tools unless the specific tool is approved for it.
- Confidential information: Do not enter confidential information into AI tools unless the specific tool is approved for it.
- Source code: Do not enter source code into AI tools unless the specific tool is approved for it.
- Contracts: Do not enter contracts into AI tools unless the specific tool is approved for it.
- Financial information: Do not enter financial information into AI tools unless the specific tool is approved for it.
- Employee data: Do not enter employee data into AI tools unless the specific tool is approved for it.
- Health data: Never enter health data into AI tools that are not specifically approved and contracted for health data.
- Legal/privileged material: Do not enter legal/privileged material into AI tools unless the specific tool is approved for it.
- Trade secrets: Do not enter trade secrets into AI tools unless the specific tool is approved for it.
- Credentials / secrets / API keys: Never enter credentials, passwords, API keys or secrets into any AI tool.
- Sensitive regulatory data: Do not enter sensitive regulatory data into AI tools unless the specific tool is approved for it.

## Human-review requirements


| Context | Requirement |
| --- | --- |
| Client communications | Required — Required — currently performed. Keep documenting the reviewer. |
| Legal / compliance analysis | Required — Required — currently performed. Keep documenting the reviewer. |
| HR / employment decisions | Required — Required — currently performed. Keep documenting the reviewer. |
| Financial decisions | Required — Required — currently performed. Keep documenting the reviewer. |
| Code deployment | Required — Required — currently performed. Keep documenting the reviewer. |
| Public marketing content | Required — Required — currently performed. Keep documenting the reviewer. |
| Customer support | Required — Required — currently performed. Keep documenting the reviewer. |
| Regulated / high-impact activities | Required — Required — currently performed. Keep documenting the reviewer. |


## Employee disclosure rules


| Context | Rule |
| --- | --- |
| Internal use of AI | Required — Disclosure rule already exists — keep it documented. |
| Communications to clients/customers | Required — Disclosure rule already exists — keep it documented. |
| Public-facing content | Required — Disclosure recommended/required — adopt a clear rule. |
| AI-generated images/audio/video | Required — Disclosure recommended/required — adopt a clear rule. |
| Decisions based on AI output | Recommended — Consider whether disclosure is appropriate here. |
| AI used in regulated work | Required — Disclosure recommended/required — adopt a clear rule. |


## Incident-reporting process


### What counts as an incident

- Accidental upload of sensitive, personal or confidential data to an AI tool.
- Inaccurate, hallucinated or fabricated AI output that was relied upon.
- Discriminatory or biased AI output.
- Security incident or suspected data exposure via an AI tool.
- Use of an unauthorized AI tool, or vendor outage.

### Report to

Report to the AI governance owner (or IT/Security and Legal/Compliance if unassigned).


### Timeline

Report without undue delay — ideally within 24 hours of discovery.


### Information to include

- What happened and when.
- Which tool and data were involved.
- Who was affected and potential impact.

### Escalation

- AI governance owner assesses severity.
- Escalate to Legal/Compliance and Security for high-severity incidents.
- Notify affected parties/regulators only on professional advice.

### Containment

- Stop the activity and revoke access if needed.
- Request deletion from the vendor where possible.
- Preserve evidence for review.

### Documentation

- Record the incident, decisions and actions taken.
- Track remediation to completion.
- Feed lessons learned back into training and this policy.

## AI literacy checklist

- Understand what AI can and cannot do (its limitations).
- Verify outputs before relying on them.
- Protect confidential data — do not paste it into public tools.
- Avoid misuse of personal data; apply data minimization.
- Check intellectual-property risks in AI outputs.
- Detect hallucinations and fabricated facts.
- Apply human review in high-impact contexts.
- Follow approved-tool rules and statuses.
- Know how and when to report incidents.

## Vendor-approval workflow


### When required

- Before adopting any new AI tool or vendor.
- When an existing vendor adds AI features or changes its model.
- Before sending confidential, personal or client data to a tool.

### Intake fields

- Tool/vendor name and purpose.
- Data types to be processed.
- Plan/tier (free vs. enterprise) and account type.
- Business owner requesting the tool.

### Review steps

- Privacy review: lawful basis, data processing terms, training on data.
- Security review: certifications, data location, retention/deletion.
- Legal review: subprocessors, audit rights, incident notice, liability.

### Approval roles

- Privacy/DPO sign-off.
- Security/IT sign-off.
- Legal/compliance sign-off.

### Contract checks

- No training on customer data without consent.
- Defined retention and deletion.
- Incident notification and audit rights.
- Liability, indemnities and regulatory cooperation.

### Review cadence

Re-review approved vendors at least annually or on material change.


## Recommended next steps

- Have this preliminary package reviewed and adapted by qualified professionals.
- Re-run this assessment after implementing changes to track progress.

## Professional review

Have the policy reviewed and adapted to your company.

This package is a preliminary draft. Our team can review and adapt it to your company, jurisdiction and risk profile, and train your employees.

⚠ This tool generates preliminary AI governance materials for informational purposes only. It is not legal advice, not a final compliance review, and does not create a lawyer-client relationship. Your company's AI policy should be reviewed and adapted by qualified professionals before implementation.
