import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import * as XLSX from "xlsx";
import { z } from "zod";

import { getContacts, getWorkspaceContext, type ContactListItem } from "@/lib/data";
import { createActivityRecord } from "@/lib/workspace-mutations";
import {
  ACTIVITY_STATUSES,
  ACTIVITY_STATUS_LABELS,
  ACTIVITY_TYPES,
  ACTIVITY_TYPE_LABELS,
  CONTACT_STATUSES,
} from "@/lib/constants";
import { getErrorMessage } from "@/lib/utils";
import type { Database } from "@/types/database";

const MAX_IMPORT_ROWS = 500;
const AI_CHUNK_SIZE = 60;
const MAX_CELL_VALUE_LENGTH = 500;
const HEADER_ALIAS_MAP = {
  activityDate: [
    "activity date",
    "date",
    "timestamp",
    "sent at",
    "sent date",
    "created at",
    "event date",
    "last contacted",
    "touchpoint date",
    "time",
    "datetime",
    "თარიღი",
    "აქტივობის თარიღი",
    "გაგზავნის თარიღი",
    "დრო",
  ],
  contactName: [
    "contact",
    "contact name",
    "name",
    "full name",
    "person",
    "lead",
    "prospect",
    "recipient",
    "recipient name",
    "client",
    "client name",
    "კონტაქტი",
    "კონტაქტის სახელი",
    "სახელი",
    "სრული სახელი",
    "მიმღები",
    "კლიენტი",
  ],
  contactStatus: [
    "contact status",
    "lead status",
    "crm status",
    "person status",
    "კონტაქტის სტატუსი",
    "ლიდის სტატუსი",
    "სტატუსი",
  ],
  content: [
    "content",
    "note",
    "message",
    "summary",
    "body",
    "details",
    "activity",
    "description",
    "message body",
    "outreach note",
    "შინაარსი",
    "შეტყობინება",
    "აღწერა",
    "ტექსტი",
    "შენიშვნა",
  ],
  gmail: [
    "gmail",
    "email",
    "email address",
    "work email",
    "personal email",
    "contact email",
    "recipient email",
    "ელფოსტა",
    "იმეილი",
    "ემაილი",
    "ფოსტა",
  ],
  linkedin: [
    "linkedin",
    "linkedin url",
    "linkedin profile",
    "profile url",
    "ლინკედინი",
    "ლინკდინის ბმული",
    "პროფილის ბმული",
  ],
  name: [
    "name",
    "full name",
    "contact",
    "contact name",
    "person",
    "lead",
    "prospect",
    "სახელი",
    "სრული სახელი",
    "კონტაქტი",
  ],
  note: ["note", "notes", "comment", "comments", "context", "memo", "შენიშვნა", "კომენტარი", "კონტექსტი"],
  organizationName: [
    "organization",
    "organization name",
    "company",
    "company name",
    "account",
    "business",
    "კომპანია",
    "ორგანიზაცია",
    "კომპანიის სახელი",
    "ორგანიზაციის სახელი",
  ],
  role: ["role", "title", "job title", "position", "occupation", "როლი", "პოზიცია", "თანამდებობა"],
  status: ["status", "activity status", "result", "state", "სტატუსი", "აქტივობის სტატუსი", "შედეგი"],
  telegram: ["telegram", "telegram username", "telegram handle", "ტელეგრამი", "ტელეგრამის იუზერი"],
  type: ["type", "channel", "activity type", "source", "ტიპი", "არხი", "აქტივობის ტიპი"],
  whatsapp: ["whatsapp", "whatsapp number", "phone", "mobile", "phone number", "ვოთსაფი", "ვაცაპი", "ტელეფონი", "მობილური"],
} as const;

const importedContactRowSchema = z.object({
  sourceSheet: z.string(),
  sourceRow: z.number().int().positive(),
  name: z.string(),
  organizationName: z.string(),
  role: z.string(),
  gmail: z.string(),
  linkedin: z.string(),
  telegram: z.string(),
  whatsapp: z.string(),
  status: z.enum(CONTACT_STATUSES),
  note: z.string(),
});

const importedContactsDocumentSchema = z.object({
  contacts: z.array(importedContactRowSchema),
});

const importedActivityRowSchema = z.object({
  sourceSheet: z.string(),
  sourceRow: z.number().int().positive(),
  activityDate: z.string(),
  type: z.enum(ACTIVITY_TYPES),
  status: z.enum(ACTIVITY_STATUSES),
  content: z.string(),
  contactName: z.string(),
  organizationName: z.string(),
  role: z.string(),
  gmail: z.string(),
  linkedin: z.string(),
  telegram: z.string(),
  whatsapp: z.string(),
  contactStatus: z.enum(CONTACT_STATUSES),
  note: z.string(),
});

const importedActivitiesDocumentSchema = z.object({
  activities: z.array(importedActivityRowSchema),
});

type WorkbookRow = {
  sheet: string;
  rowNumber: number;
  values: Record<string, string>;
};

type MutableContact = ContactListItem;
type OrganizationRow = Database["public"]["Tables"]["organizations"]["Row"];

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  return new OpenAI({ apiKey });
}

function getImportModel() {
  return process.env.OPENAI_IMPORT_MODEL || "gpt-4o-mini";
}

function trimToEmpty(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function normalizeWhitespace(value: string) {
  return trimToEmpty(value).replace(/\s+/g, " ");
}

function normalizeEmail(value: string) {
  return trimToEmpty(value).toLowerCase();
}

function normalizeLinkedIn(value: string) {
  return trimToEmpty(value)
    .toLowerCase()
    .replace(/^https?:\/\/(www\.)?/, "")
    .replace(/\/+$/, "");
}

function normalizeTelegram(value: string) {
  return trimToEmpty(value).toLowerCase().replace(/^@/, "");
}

function normalizeWhatsapp(value: string) {
  return trimToEmpty(value).replace(/[^\d+]/g, "");
}

function normalizeName(value: string) {
  return normalizeWhitespace(value).toLowerCase();
}

function toNullableString(value: string) {
  return trimToEmpty(value) || null;
}

function sanitizeWorkbookCell(value: unknown) {
  return String(value ?? "")
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, MAX_CELL_VALUE_LENGTH);
}

function isLikelyExcelSerial(value: string) {
  return /^\d+(\.\d+)?$/.test(value.trim());
}

function formatDateFromExcelSerial(value: string) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "";
  }

  const parsed = XLSX.SSF.parse_date_code(numeric);

  if (!parsed) {
    return "";
  }

  const utcDate = new Date(
    Date.UTC(
      parsed.y,
      parsed.m - 1,
      parsed.d,
      parsed.H ?? 0,
      parsed.M ?? 0,
      parsed.S ?? 0,
    ),
  );

  return Number.isNaN(utcDate.getTime()) ? "" : utcDate.toISOString();
}

function normalizeImportDate(value: string) {
  const trimmed = trimToEmpty(value);

  if (!trimmed) {
    return "";
  }

  if (isLikelyExcelSerial(trimmed)) {
    const excelDate = formatDateFromExcelSerial(trimmed);

    if (excelDate) {
      return excelDate;
    }
  }

  const directDate = new Date(trimmed);

  if (!Number.isNaN(directDate.getTime())) {
    return directDate.toISOString();
  }

  const normalizedSlashes = trimmed.match(
    /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})(?:\s+(\d{1,2})(?::(\d{2}))?(?::(\d{2}))?\s*(AM|PM)?)?$/i,
  );

  if (normalizedSlashes) {
    const first = Number(normalizedSlashes[1]);
    const second = Number(normalizedSlashes[2]);
    const third = Number(normalizedSlashes[3].length === 2 ? `20${normalizedSlashes[3]}` : normalizedSlashes[3]);
    let hours = Number(normalizedSlashes[4] ?? 0);
    const minutes = Number(normalizedSlashes[5] ?? 0);
    const seconds = Number(normalizedSlashes[6] ?? 0);
    const period = normalizedSlashes[7]?.toUpperCase();

    if (period === "PM" && hours < 12) {
      hours += 12;
    }

    if (period === "AM" && hours === 12) {
      hours = 0;
    }

    const monthFirst = first <= 12 ? first : second;
    const daySecond = first <= 12 ? second : first;
    const fallbackDate = new Date(Date.UTC(third, monthFirst - 1, daySecond, hours, minutes, seconds));

    if (!Number.isNaN(fallbackDate.getTime())) {
      return fallbackDate.toISOString();
    }
  }

  return "";
}

function buildFallbackActivityContent(input: {
  activityDate: string;
  contactName: string;
  organizationName: string;
  status: Database["public"]["Enums"]["activity_status"];
  type: Database["public"]["Enums"]["activity_type"];
}) {
  const contact = normalizeWhitespace(input.contactName);
  const organization = normalizeWhitespace(input.organizationName);
  const parts = [
    ACTIVITY_TYPE_LABELS[input.type],
    ACTIVITY_STATUS_LABELS[input.status].toLowerCase(),
  ];

  if (contact) {
    parts.push(`with ${contact}`);
  }

  if (organization) {
    parts.push(`at ${organization}`);
  }

  const timestamp = normalizeImportDate(input.activityDate);

  if (timestamp) {
    parts.push(`on ${new Date(timestamp).toISOString().slice(0, 10)}`);
  }

  return parts.join(" ");
}

function normalizeHeaderKey(value: string) {
  return value
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildNormalizedValueMap(values: Record<string, string>) {
  return new Map(
    Object.entries(values).map(([key, value]) => [normalizeHeaderKey(key), value]),
  );
}

function getAliasedValue(
  values: Record<string, string>,
  aliases: readonly string[],
) {
  const normalizedValues = buildNormalizedValueMap(values);

  for (const alias of aliases) {
    const match = normalizedValues.get(normalizeHeaderKey(alias));

    if (match !== undefined) {
      return trimToEmpty(match);
    }
  }

  return "";
}

function rowsHaveRecognizableHeaders(
  rows: WorkbookRow[],
  keys: readonly (keyof typeof HEADER_ALIAS_MAP)[],
) {
  const normalizedHeaders = new Set(
    rows.flatMap((row) => Object.keys(row.values).map((header) => normalizeHeaderKey(header))),
  );

  return keys.some((key) =>
    HEADER_ALIAS_MAP[key].some((alias) => normalizedHeaders.has(normalizeHeaderKey(alias))),
  );
}

function normalizeContactStatusValue(value: string) {
  const normalized = normalizeHeaderKey(value);

  if (!normalized) {
    return "new" satisfies Database["public"]["Enums"]["contact_status"];
  }

  const mapping: Record<string, Database["public"]["Enums"]["contact_status"]> = {
    archived: "archived",
    "დაარქივებული": "archived",
    closed: "closed",
    "დახურული": "closed",
    contacted: "contacted",
    "დაკონტაქტებული": "contacted",
    interested: "interested",
    "დაინტერესებული": "interested",
    "meeting scheduled": "meeting_scheduled",
    meeting: "meeting_scheduled",
    "შეხვედრა": "meeting_scheduled",
    "შეხვედრა ჩანიშნულია": "meeting_scheduled",
    "not interested": "not_interested",
    "no interest": "not_interested",
    "არ არის დაინტერესებული": "not_interested",
    "არაინტერესდება": "not_interested",
    new: "new",
    "ახალი": "new",
    replied: "replied",
    response: "replied",
    "უპასუხა": "replied",
    "პასუხი": "replied",
  };

  return mapping[normalized] ?? "new";
}

function normalizeActivityStatusValue(value: string) {
  const normalized = normalizeHeaderKey(value);

  if (!normalized) {
    return "completed" satisfies Database["public"]["Enums"]["activity_status"];
  }

  const mapping: Record<string, Database["public"]["Enums"]["activity_status"]> = {
    completed: "completed",
    "დასრულებული": "completed",
    "შესრულებული": "completed",
    done: "completed",
    failed: "failed",
    "ჩავარდა": "failed",
    "წარუმატებელი": "failed",
    planned: "planned",
    "დაგეგმილი": "planned",
    replied: "replied",
    response: "replied",
    "უპასუხა": "replied",
    "პასუხი": "replied",
    sent: "sent",
    "გაგზავნილი": "sent",
  };

  return mapping[normalized] ?? "completed";
}

function normalizeActivityTypeValue(value: string) {
  const normalized = normalizeHeaderKey(value);

  const mapping: Record<string, Database["public"]["Enums"]["activity_type"]> = {
    call: "call",
    calls: "call",
    "ზარი": "call",
    email: "email",
    emails: "email",
    "ელფოსტა": "email",
    "იმეილი": "email",
    "ემაილი": "email",
    linkedin: "linkedin",
    "linkedin message": "linkedin",
    "ლინკედინი": "linkedin",
    meeting: "meeting",
    meetings: "meeting",
    "შეხვედრა": "meeting",
    note: "note",
    notes: "note",
    "შენიშვნა": "note",
    "კომენტარი": "note",
    telegram: "telegram",
    "ტელეგრამი": "telegram",
    whatsapp: "whatsapp",
    "ვოთსაფი": "whatsapp",
    "ვაცაპი": "whatsapp",
  };

  return mapping[normalized] ?? "note";
}

function parseContactsDeterministically(rows: WorkbookRow[]) {
  if (
    !rowsHaveRecognizableHeaders(rows, [
      "name",
      "gmail",
      "linkedin",
      "telegram",
      "whatsapp",
      "organizationName",
    ])
  ) {
    return null;
  }

  const contacts = rows.map((row) => ({
    sourceSheet: row.sheet,
    sourceRow: row.rowNumber,
    name: getAliasedValue(row.values, HEADER_ALIAS_MAP.name),
    organizationName: getAliasedValue(row.values, HEADER_ALIAS_MAP.organizationName),
    role: getAliasedValue(row.values, HEADER_ALIAS_MAP.role),
    gmail: getAliasedValue(row.values, HEADER_ALIAS_MAP.gmail),
    linkedin: getAliasedValue(row.values, HEADER_ALIAS_MAP.linkedin),
    telegram: getAliasedValue(row.values, HEADER_ALIAS_MAP.telegram),
    whatsapp: getAliasedValue(row.values, HEADER_ALIAS_MAP.whatsapp),
    status: normalizeContactStatusValue(getAliasedValue(row.values, HEADER_ALIAS_MAP.status)),
    note: getAliasedValue(row.values, HEADER_ALIAS_MAP.note),
  }));

  return contacts.filter((contact) =>
    [
      contact.name,
      contact.gmail,
      contact.linkedin,
      contact.telegram,
      contact.whatsapp,
      contact.organizationName,
      contact.role,
    ].some((value) => trimToEmpty(value).length),
  );
}

function parseActivitiesDeterministically(rows: WorkbookRow[]) {
  if (
    !rowsHaveRecognizableHeaders(rows, [
      "activityDate",
      "content",
      "contactName",
      "gmail",
      "linkedin",
      "telegram",
      "whatsapp",
    ])
  ) {
    return null;
  }

  const activities = rows.map((row) => ({
    sourceSheet: row.sheet,
    sourceRow: row.rowNumber,
    activityDate: normalizeImportDate(
      getAliasedValue(row.values, HEADER_ALIAS_MAP.activityDate),
    ),
    type: normalizeActivityTypeValue(getAliasedValue(row.values, HEADER_ALIAS_MAP.type)),
    status: normalizeActivityStatusValue(getAliasedValue(row.values, HEADER_ALIAS_MAP.status)),
    content: getAliasedValue(row.values, HEADER_ALIAS_MAP.content),
    contactName: getAliasedValue(row.values, HEADER_ALIAS_MAP.contactName),
    organizationName: getAliasedValue(row.values, HEADER_ALIAS_MAP.organizationName),
    role: getAliasedValue(row.values, HEADER_ALIAS_MAP.role),
    gmail: getAliasedValue(row.values, HEADER_ALIAS_MAP.gmail),
    linkedin: getAliasedValue(row.values, HEADER_ALIAS_MAP.linkedin),
    telegram: getAliasedValue(row.values, HEADER_ALIAS_MAP.telegram),
    whatsapp: getAliasedValue(row.values, HEADER_ALIAS_MAP.whatsapp),
    contactStatus: normalizeContactStatusValue(
      getAliasedValue(row.values, HEADER_ALIAS_MAP.contactStatus),
    ),
    note: getAliasedValue(row.values, HEADER_ALIAS_MAP.note),
  }));

  return activities.filter((activity) =>
    [
      activity.activityDate,
      activity.content,
      activity.contactName,
      activity.gmail,
      activity.linkedin,
      activity.telegram,
      activity.whatsapp,
    ].some((value) => trimToEmpty(value).length),
  );
}

function inferContactNameFromIdentifiers(input: {
  contactName?: string;
  gmail?: string;
  linkedin?: string;
  telegram?: string;
}) {
  const explicit = normalizeWhitespace(input.contactName ?? "");

  if (explicit.length >= 2) {
    return explicit;
  }

  const email = trimToEmpty(input.gmail);

  if (email.includes("@")) {
    return email
      .split("@")[0]
      .replace(/[._-]+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
      .trim();
  }

  const linkedIn = trimToEmpty(input.linkedin)
    .replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//i, "")
    .replace(/\/+$/, "");

  if (linkedIn.length >= 2) {
    return linkedIn
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
      .trim();
  }

  const telegram = trimToEmpty(input.telegram).replace(/^@/, "");

  if (telegram.length >= 2) {
    return telegram
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
      .trim();
  }

  return "";
}

async function extractWorkbookRows(file: File) {
  const filename = trimToEmpty(file.name);

  if (!/\.(csv|xlsx|xls)$/i.test(filename)) {
    throw new Error("Upload a CSV or Excel file (.csv, .xls, .xlsx).");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, {
    type: "buffer",
    cellDates: false,
    raw: false,
  });

  const rows: WorkbookRow[] = [];

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];

    if (!worksheet) {
      continue;
    }

    const rawRows = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(worksheet, {
      header: 1,
      raw: false,
      defval: "",
      blankrows: false,
    });

    const firstNonEmptyRowIndex = rawRows.findIndex((row) =>
      row.some((cell) => trimToEmpty(String(cell ?? "")).length),
    );

    if (firstNonEmptyRowIndex === -1) {
      continue;
    }

    const headerRow = rawRows[firstNonEmptyRowIndex];
    const headers = headerRow.map((header, index) => {
      const normalized = sanitizeWorkbookCell(header);
      return normalized.length ? normalized : `column_${index + 1}`;
    });

    rawRows.slice(firstNonEmptyRowIndex + 1).forEach((row, rowOffset) => {
      const values = Object.fromEntries(
        headers.map((header, index) => [header, sanitizeWorkbookCell(row[index])]),
      );

      if (!Object.values(values).some((value) => trimToEmpty(value).length)) {
        return;
      }

      rows.push({
        rowNumber: firstNonEmptyRowIndex + rowOffset + 2,
        sheet: sheetName,
        values,
      });
    });
  }

  if (!rows.length) {
    throw new Error("The file did not contain any importable rows.");
  }

  if (rows.length > MAX_IMPORT_ROWS) {
    throw new Error(`Import files are limited to ${MAX_IMPORT_ROWS} populated rows.`);
  }

  return rows;
}

async function parseContactsWithOpenAI(rows: WorkbookRow[]) {
  const client = getOpenAIClient();
  const contacts: z.infer<typeof importedContactRowSchema>[] = [];

  for (let start = 0; start < rows.length; start += AI_CHUNK_SIZE) {
    const chunk = rows.slice(start, start + AI_CHUNK_SIZE);
    const response = await client.responses.parse({
      model: getImportModel(),
      input: [
        {
          role: "system",
          content:
            "You convert spreadsheet rows into CRM contacts. You may receive English or Georgian headers and values. Use the row values exactly when possible. Return one contact per valid person row. Use empty strings for unknown text fields. Normalize status to one of: new, contacted, replied, interested, not_interested, meeting_scheduled, closed, archived. Ignore rows that are not actual contacts.",
        },
        {
          role: "user",
          content: JSON.stringify(
            {
              task: "Extract contacts from these workbook rows.",
              rows: chunk,
            },
            null,
            2,
          ),
        },
      ],
      text: {
        format: zodTextFormat(importedContactsDocumentSchema, "contacts_import"),
      },
    });

    if (!response.output_parsed) {
      throw new Error("OpenAI could not parse the contacts file.");
    }

    contacts.push(...response.output_parsed.contacts);
  }

  return contacts;
}

async function parseActivitiesWithOpenAI(rows: WorkbookRow[]) {
  const client = getOpenAIClient();
  const activities: z.infer<typeof importedActivityRowSchema>[] = [];

  for (let start = 0; start < rows.length; start += AI_CHUNK_SIZE) {
    const chunk = rows.slice(start, start + AI_CHUNK_SIZE);
    const response = await client.responses.parse({
      model: getImportModel(),
      input: [
        {
          role: "system",
          content:
            "You convert spreadsheet rows into outreach activity records. You may receive English or Georgian headers and values. Return only rows that represent outreach touchpoints. Use empty strings for unknown text fields. Normalize type to one of: email, linkedin, telegram, whatsapp, call, meeting, note. Normalize status to one of: planned, sent, replied, completed, failed. Normalize contactStatus to one of: new, contacted, replied, interested, not_interested, meeting_scheduled, closed, archived.",
        },
        {
          role: "user",
          content: JSON.stringify(
            {
              task: "Extract outreach activities from these workbook rows.",
              rows: chunk,
            },
            null,
            2,
          ),
        },
      ],
      text: {
        format: zodTextFormat(importedActivitiesDocumentSchema, "activities_import"),
      },
    });

    if (!response.output_parsed) {
      throw new Error("OpenAI could not parse the outreach activities file.");
    }

    activities.push(...response.output_parsed.activities);
  }

  return activities;
}

async function loadOrganizationCache(workspaceSlug: string) {
  const { supabase, workspace } = await getWorkspaceContext(workspaceSlug);
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("workspace_id", workspace.id);

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  const byName = new Map<string, OrganizationRow>();

  for (const organization of data ?? []) {
    byName.set(normalizeName(organization.name), organization as OrganizationRow);
  }

  return { byName, supabase, workspace };
}

async function resolveOrganizationIdByName(
  params: {
    byName: Map<string, OrganizationRow>;
    supabase: Awaited<ReturnType<typeof getWorkspaceContext>>["supabase"];
    workspaceId: string;
  },
  name: string,
) {
  const trimmed = normalizeWhitespace(name);

  if (!trimmed) {
    return null;
  }

  const normalizedName = normalizeName(trimmed);
  const cached = params.byName.get(normalizedName);

  if (cached) {
    return cached.id;
  }

  const { data, error } = await params.supabase
    .from("organizations")
    .insert({
      name: trimmed,
      workspace_id: params.workspaceId,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  const row = data as OrganizationRow;
  params.byName.set(normalizedName, row);
  return row.id;
}

function findMatchingContact(
  contacts: MutableContact[],
  input: {
    gmail?: string;
    linkedin?: string;
    name?: string;
    organizationName?: string;
    telegram?: string;
    whatsapp?: string;
  },
) {
  const email = normalizeEmail(input.gmail ?? "");
  const linkedIn = normalizeLinkedIn(input.linkedin ?? "");
  const telegram = normalizeTelegram(input.telegram ?? "");
  const whatsapp = normalizeWhatsapp(input.whatsapp ?? "");
  const name = normalizeName(input.name ?? "");
  const organizationName = normalizeName(input.organizationName ?? "");

  if (email) {
    const match = contacts.find((contact) => normalizeEmail(contact.gmail ?? "") === email);
    if (match) {
      return match;
    }
  }

  if (linkedIn) {
    const match = contacts.find(
      (contact) => normalizeLinkedIn(contact.linkedin ?? "") === linkedIn,
    );
    if (match) {
      return match;
    }
  }

  if (telegram) {
    const match = contacts.find(
      (contact) => normalizeTelegram(contact.telegram ?? "") === telegram,
    );
    if (match) {
      return match;
    }
  }

  if (whatsapp) {
    const match = contacts.find(
      (contact) => normalizeWhatsapp(contact.whatsapp ?? "") === whatsapp,
    );
    if (match) {
      return match;
    }
  }

  if (name && organizationName) {
    const match = contacts.find(
      (contact) =>
        normalizeName(contact.name) === name &&
        normalizeName(contact.organizationName ?? "") === organizationName,
    );
    if (match) {
      return match;
    }
  }

  if (name) {
    const matches = contacts.filter((contact) => normalizeName(contact.name) === name);
    if (matches.length === 1) {
      return matches[0];
    }
  }

  return null;
}

type UpsertImportContext = {
  contacts: MutableContact[];
  organizationCache: Map<string, OrganizationRow>;
  supabase: Awaited<ReturnType<typeof getWorkspaceContext>>["supabase"];
  workspaceId: string;
};

async function upsertImportedContact(
  context: UpsertImportContext,
  input: {
    gmail: string;
    linkedin: string;
    name: string;
    note: string;
    organizationName: string;
    role: string;
    status: Database["public"]["Enums"]["contact_status"];
    telegram: string;
    whatsapp: string;
  },
) {
  const matched = findMatchingContact(context.contacts, input);
  const organizationId = await resolveOrganizationIdByName(
    {
      byName: context.organizationCache,
      supabase: context.supabase,
      workspaceId: context.workspaceId,
    },
    input.organizationName,
  );

  if (matched) {
    const { error } = await context.supabase
      .from("contacts")
      .update({
        gmail: toNullableString(input.gmail) ?? matched.gmail,
        linkedin: toNullableString(input.linkedin) ?? matched.linkedin,
        name: normalizeWhitespace(input.name) || matched.name,
        note: toNullableString(input.note) ?? matched.note,
        organization_id: organizationId ?? matched.organization_id,
        role: toNullableString(input.role) ?? matched.role,
        status: input.status || matched.status,
        telegram: toNullableString(input.telegram) ?? matched.telegram,
        whatsapp: toNullableString(input.whatsapp) ?? matched.whatsapp,
      })
      .eq("workspace_id", context.workspaceId)
      .eq("id", matched.id);

    if (error) {
      throw new Error(getErrorMessage(error));
    }

    matched.gmail = toNullableString(input.gmail) ?? matched.gmail;
    matched.linkedin = toNullableString(input.linkedin) ?? matched.linkedin;
    matched.name = normalizeWhitespace(input.name) || matched.name;
    matched.note = toNullableString(input.note) ?? matched.note;
    matched.organization_id = organizationId ?? matched.organization_id;
    matched.organizationName = normalizeWhitespace(input.organizationName) || matched.organizationName;
    matched.role = toNullableString(input.role) ?? matched.role;
    matched.status = input.status || matched.status;
    matched.telegram = toNullableString(input.telegram) ?? matched.telegram;
    matched.whatsapp = toNullableString(input.whatsapp) ?? matched.whatsapp;

    return { contact: matched, mode: "updated" as const };
  }

  const { data, error } = await context.supabase
    .from("contacts")
    .insert({
      gmail: toNullableString(input.gmail),
      linkedin: toNullableString(input.linkedin),
      name: normalizeWhitespace(input.name),
      note: toNullableString(input.note),
      organization_id: organizationId,
      role: toNullableString(input.role),
      status: input.status,
      telegram: toNullableString(input.telegram),
      whatsapp: toNullableString(input.whatsapp),
      workspace_id: context.workspaceId,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  const created = {
    ...(data as Database["public"]["Tables"]["contacts"]["Row"]),
    organizationName: normalizeWhitespace(input.organizationName) || null,
    responsibleUserEmail: null,
    responsibleUserName: null,
  } satisfies MutableContact;

  context.contacts.push(created);

  return { contact: created, mode: "created" as const };
}

export async function importContactsFile(workspaceSlug: string, file: File) {
  const workbookRows = await extractWorkbookRows(file);
  const parsedContacts =
    parseContactsDeterministically(workbookRows) ??
    (await parseContactsWithOpenAI(workbookRows));
  const { byName, supabase, workspace } = await loadOrganizationCache(workspaceSlug);
  const existingContacts = await getContacts(workspace.id);
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of parsedContacts) {
    const name = normalizeWhitespace(row.name);
    const hasIdentifier =
      name.length >= 2 ||
      normalizeEmail(row.gmail).length > 0 ||
      normalizeLinkedIn(row.linkedin).length > 0 ||
      normalizeTelegram(row.telegram).length > 0 ||
      normalizeWhatsapp(row.whatsapp).length > 0;

    if (!hasIdentifier) {
      skipped += 1;
      continue;
    }

    const finalName =
      name.length >= 2
        ? name
        : inferContactNameFromIdentifiers({
            contactName: row.name,
            gmail: row.gmail,
            linkedin: row.linkedin,
            telegram: row.telegram,
          });

    if (finalName.length < 2) {
      skipped += 1;
      continue;
    }

    const result = await upsertImportedContact(
      {
        contacts: existingContacts,
        organizationCache: byName,
        supabase,
        workspaceId: workspace.id,
      },
      {
        gmail: row.gmail,
        linkedin: row.linkedin,
        name: finalName,
        note: row.note,
        organizationName: row.organizationName,
        role: row.role,
        status: row.status,
        telegram: row.telegram,
        whatsapp: row.whatsapp,
      },
    );

    if (result.mode === "created") {
      created += 1;
    } else {
      updated += 1;
    }
  }

  return {
    created,
    skipped,
    totalParsed: parsedContacts.length,
    updated,
  };
}

export async function importOutreachActivitiesFile(workspaceSlug: string, file: File) {
  const workbookRows = await extractWorkbookRows(file);
  const parsedActivities =
    parseActivitiesDeterministically(workbookRows) ??
    (await parseActivitiesWithOpenAI(workbookRows));
  const { byName, supabase, workspace } = await loadOrganizationCache(workspaceSlug);
  const existingContacts = await getContacts(workspace.id);
  let createdActivities = 0;
  let createdContacts = 0;
  let skippedActivities = 0;
  let updatedContacts = 0;
  const skipReasons: string[] = [];

  for (const row of parsedActivities) {
    const inferredName = inferContactNameFromIdentifiers({
      contactName: row.contactName,
      gmail: row.gmail,
      linkedin: row.linkedin,
      telegram: row.telegram,
    });

    const hasAnyIdentity =
      inferredName.length >= 2 ||
      normalizeEmail(row.gmail).length > 0 ||
      normalizeLinkedIn(row.linkedin).length > 0 ||
      normalizeTelegram(row.telegram).length > 0 ||
      normalizeWhatsapp(row.whatsapp).length > 0;

    if (!hasAnyIdentity) {
      skippedActivities += 1;
      if (skipReasons.length < 5) {
        skipReasons.push(
          `Row ${row.sourceRow} on ${row.sourceSheet}: missing contact identifier (name, email, LinkedIn, Telegram, or WhatsApp).`,
        );
      }
      continue;
    }

    if (!normalizeWhitespace(row.activityDate)) {
      skippedActivities += 1;
      if (skipReasons.length < 5) {
        skipReasons.push(
          `Row ${row.sourceRow} on ${row.sourceSheet}: missing or unrecognized activity date.`,
        );
      }
      continue;
    }

    const activityContent =
      normalizeWhitespace(row.content) ||
      buildFallbackActivityContent({
        activityDate: row.activityDate,
        contactName: inferredName,
        organizationName: row.organizationName,
        status: row.status,
        type: row.type,
      });

    const upserted = await upsertImportedContact(
      {
        contacts: existingContacts,
        organizationCache: byName,
        supabase,
        workspaceId: workspace.id,
      },
      {
        gmail: row.gmail,
        linkedin: row.linkedin,
        name: inferredName,
        note: row.note,
        organizationName: row.organizationName,
        role: row.role,
        status: row.contactStatus,
        telegram: row.telegram,
        whatsapp: row.whatsapp,
      },
    );

    if (upserted.mode === "created") {
      createdContacts += 1;
    } else {
      updatedContacts += 1;
    }

    try {
      await createActivityRecord(workspaceSlug, {
        activityDate: row.activityDate,
        contactId: upserted.contact.id,
        content: activityContent,
        organizationId: upserted.contact.organization_id ?? null,
        status: row.status,
        type: row.type,
      });
      createdActivities += 1;
    } catch (error) {
      skippedActivities += 1;
      if (skipReasons.length < 5) {
        skipReasons.push(
          `Row ${row.sourceRow} on ${row.sourceSheet}: ${getErrorMessage(error)}`,
        );
      }
    }
  }

  if (!createdActivities && parsedActivities.length) {
    throw new Error(
      [
        "No outreach activities could be imported.",
        ...skipReasons.slice(0, 3),
      ].join(" "),
    );
  }

  return {
    createdActivities,
    createdContacts,
    skippedActivities,
    totalParsed: parsedActivities.length,
    updatedContacts,
  };
}
