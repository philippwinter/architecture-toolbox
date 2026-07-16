import { z } from 'zod';
import type {
  CapabilityGroupInput,
  CapabilityInput,
  CapabilityMapInput,
  MetadataValue,
  RootItemInput,
} from './types';

const idSchema = z
  .string()
  .min(1, 'Eine ID darf nicht leer sein.')
  .regex(
    /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/,
    'Die ID darf nur Buchstaben, Zahlen, Punkt, Unterstrich und Bindestrich enthalten.',
  );

const nonEmptyString = z.string().trim().min(1, 'Der Wert darf nicht leer sein.');
const colorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Erwartet wird eine RGB-Hex-Farbe im Format #RRGGBB.');

const metadataValueSchema: z.ZodType<MetadataValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number().finite(),
    z.boolean(),
    z.null(),
    z.array(metadataValueSchema),
    z.record(z.string(), metadataValueSchema),
  ]),
);

const visualizationSchema = z
  .object({
    color: colorSchema.optional(),
    icon: nonEmptyString.optional(),
  })
  .strict();

const layoutSchema = z
  .object({
    direction: z.enum(['vertical', 'horizontal']).optional(),
    weight: z.number().finite().positive('weight muss größer als 0 sein.').optional(),
    trackWeight: z
      .number()
      .finite()
      .positive('trackWeight muss größer als 0 sein.')
      .optional(),
  })
  .strict();

const groupVisualizationSchema = z
  .object({
    backgroundColor: colorSchema.optional(),
  })
  .strict();

export const capabilitySchema: z.ZodType<CapabilityInput> = z.lazy(() =>
  z
    .object({
      id: idSchema,
      name: nonEmptyString,
      description: z.string().optional(),
      owner: nonEmptyString.optional(),
      responsibilities: z.array(nonEmptyString).optional(),
      tags: z.array(nonEmptyString).optional(),
      visualization: visualizationSchema.optional(),
      layout: layoutSchema.optional(),
      metadata: z.record(z.string(), metadataValueSchema).optional(),
      children: z.array(capabilitySchema).optional(),
    })
    .strict(),
);

export const capabilityGroupSchema: z.ZodType<CapabilityGroupInput> = z
  .object({
    type: z.literal('group'),
    id: idSchema,
    name: nonEmptyString,
    visualization: groupVisualizationSchema.optional(),
    layout: layoutSchema.optional(),
    capabilities: z
      .array(capabilitySchema)
      .min(1, 'Eine Gruppe muss mindestens eine Capability enthalten.'),
  })
  .strict();

const rootItemSchema: z.ZodType<RootItemInput> = z.union([
  capabilityGroupSchema,
  capabilitySchema,
]);

export const capabilityMapSchema: z.ZodType<CapabilityMapInput> = z
  .object({
    version: z.literal(1, { error: 'Im MVP wird ausschließlich Schema-Version 1 unterstützt.' }),
    map: z
      .object({
        id: idSchema,
        name: nonEmptyString,
        description: z.string().optional(),
        theme: z
          .object({
            defaultColor: colorSchema.optional(),
          })
          .strict()
          .optional(),
        capabilities: z
          .array(rootItemSchema)
          .min(1, 'Die Map muss mindestens eine Wurzel-Capability enthalten.'),
      })
      .strict(),
  })
  .strict();
