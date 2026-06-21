import type { JsonSchema, ControlElement, Layout } from "@jsonforms/core";
import {
  rankWith,
  uiTypeIs,
  isStringControl,
  isNumberControl,
  isIntegerControl,
  isBooleanControl,
  isEnumControl,
  isObjectArrayControl,
  composePaths,
  createDefaultValue,
  findUISchema,
} from "@jsonforms/core";
import {
  JsonForms,
  JsonFormsDispatch,
  withJsonFormsControlProps,
  withJsonFormsArrayControlProps,
  withJsonFormsLayoutProps,
  useJsonForms,
} from "@jsonforms/react";
import type {
  ControlProps,
  ArrayControlProps,
  LayoutProps,
  UISchemaElement,
} from "@jsonforms/core";
import { Trash2, Plus, ChevronUp, ChevronDown } from "lucide-react";
import { useMemo } from "react";

function TextControl({
  data,
  handleChange,
  path,
  label,
  errors,
  description,
  required,
  schema,
}: ControlProps) {
  const isLongText = (schema.maxLength ?? 0) > 200 || schema.format === "textarea";
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-base-content">
        {label}
        {required && <span className="text-error ml-0.5">*</span>}
      </label>
      {description && (
        <p className="text-xs text-base-content/60">{description}</p>
      )}
      {isLongText ? (
        <textarea
          className="textarea textarea-bordered w-full"
          rows={3}
          value={data ?? ""}
          onChange={(e) => handleChange(path, e.target.value || undefined)}
        />
      ) : (
        <input
          type="text"
          className="input input-bordered w-full"
          value={data ?? ""}
          onChange={(e) => handleChange(path, e.target.value || undefined)}
        />
      )}
      {errors && <p className="text-error text-xs mt-0.5">{errors}</p>}
    </div>
  );
}

function NumberControl({
  data,
  handleChange,
  path,
  label,
  errors,
  description,
  required,
  schema,
}: ControlProps) {
  const isInteger = schema.type === "integer";
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-base-content">
        {label}
        {required && <span className="text-error ml-0.5">*</span>}
      </label>
      {description && (
        <p className="text-xs text-base-content/60">{description}</p>
      )}
      <input
        type="number"
        className="input input-bordered w-full"
        value={data ?? ""}
        step={isInteger ? "1" : "0.01"}
        onChange={(e) => {
          const val = e.target.value;
          if (val === "") {
            handleChange(path, undefined);
          } else if (isInteger) {
            handleChange(path, parseInt(val, 10));
          } else {
            handleChange(path, parseFloat(val));
          }
        }}
      />
      {errors && <p className="text-error text-xs mt-0.5">{errors}</p>}
    </div>
  );
}

function BooleanControl({
  data,
  handleChange,
  path,
  label,
  errors,
  description,
}: ControlProps) {
  return (
    <div className="flex items-center gap-3 py-1">
      <input
        type="checkbox"
        className="checkbox checkbox-sm"
        checked={!!data}
        onChange={(e) => handleChange(path, e.target.checked)}
      />
      <div>
        <label className="text-sm font-medium text-base-content cursor-pointer">
          {label}
        </label>
        {description && (
          <p className="text-xs text-base-content/60">{description}</p>
        )}
      </div>
      {errors && <p className="text-error text-xs ml-auto">{errors}</p>}
    </div>
  );
}

function EnumControl({
  data,
  handleChange,
  path,
  label,
  errors,
  description,
  required,
  schema,
}: ControlProps) {
  const options = (schema.enum ?? []) as unknown[];
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-base-content">
        {label}
        {required && <span className="text-error ml-0.5">*</span>}
      </label>
      {description && (
        <p className="text-xs text-base-content/60">{description}</p>
      )}
      <select
        className="select select-bordered w-full"
        value={data ?? ""}
        onChange={(e) => handleChange(path, e.target.value || undefined)}
      >
        <option value="">Selecione...</option>
        {options.map((opt) => (
          <option key={String(opt)} value={String(opt)}>
            {String(opt)}
          </option>
        ))}
      </select>
      {errors && <p className="text-error text-xs mt-0.5">{errors}</p>}
    </div>
  );
}

function ArrayControlRenderer({
  data,
  path,
  label,
  errors,
  schema,
  rootSchema,
  uischema,
  uischemas,
  addItem,
  removeItems,
  moveUp,
  moveDown,
}: ArrayControlProps) {
  const ctx = useJsonForms();
  const items = (data ?? []) as unknown[];
  const controlElement = uischema as ControlElement;

  const childUiSchema = useMemo(
    () =>
      findUISchema(
        uischemas ?? [],
        schema,
        uischema.scope,
        path,
        undefined,
        controlElement,
        rootSchema,
      ),
    [uischemas, schema, uischema.scope, path, controlElement, rootSchema],
  );

  return (
    <div className="space-y-2">
      <div>
        <label className="block text-sm font-medium text-base-content">
          {label}
        </label>
      </div>

      {items.length === 0 && (
        <p className="text-xs text-base-content/40 italic py-2">
          Nenhum item adicionado
        </p>
      )}

      {items.map((_, index) => {
        const childPath = composePaths(path, `${index}`);
        return (
          <div
            key={childPath}
            className="border border-base-300 rounded-lg p-3 space-y-3 relative"
          >
            <div className="flex items-center gap-1 absolute top-2 right-2">
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                disabled={index === 0}
                onClick={() => moveUp?.(path, index)()}
              >
                <ChevronUp className="w-3 h-3" />
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                disabled={index === items.length - 1}
                onClick={() => moveDown?.(path, index)()}
              >
                <ChevronDown className="w-3 h-3" />
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-xs text-error"
                onClick={() => removeItems?.(path, [index])()}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
            <div className="pt-1">
              <JsonFormsDispatch
                schema={schema}
                uischema={childUiSchema}
                path={childPath}
                renderers={ctx.renderers}
              />
            </div>
          </div>
        );
      })}

      {errors && <p className="text-error text-xs">{errors}</p>}

      <button
        type="button"
        className="btn btn-primary btn-sm mt-1"
        onClick={() => addItem(path, createDefaultValue(schema, rootSchema))()}
      >
        <Plus className="w-3.5 h-3.5" />
        Adicionar item
      </button>
    </div>
  );
}

function VerticalLayoutRenderer({
  uischema,
  schema,
  path,
  renderers,
  visible,
}: LayoutProps) {
  const layout = uischema as Layout;
  if (!visible) return null;
  return (
    <div className="space-y-4">
      {layout.elements.map((child, idx) => (
        <JsonFormsDispatch
          key={`${path}-${idx}`}
          uischema={child}
          schema={schema}
          path={path}
          renderers={renderers}
        />
      ))}
    </div>
  );
}

function GroupLayoutRenderer({
  uischema,
  schema,
  path,
  renderers,
  visible,
  label,
}: LayoutProps) {
  const layout = uischema as Layout;
  if (!visible) return null;
  return (
    <div className="space-y-3 border border-base-300 rounded-lg p-3">
      {label && (
        <label className="block text-sm font-medium text-base-content">
          {label}
        </label>
      )}
      {layout.elements.map((child, idx) => (
        <JsonFormsDispatch
          key={`${path}-${idx}`}
          uischema={child}
          schema={schema}
          path={path}
          renderers={renderers}
        />
      ))}
    </div>
  );
}

const ConnectedVerticalLayout = withJsonFormsLayoutProps(VerticalLayoutRenderer);
const ConnectedGroupLayout = withJsonFormsLayoutProps(GroupLayoutRenderer);

const ConnectedTextControl = withJsonFormsControlProps(TextControl);
const ConnectedNumberControl = withJsonFormsControlProps(NumberControl);
const ConnectedBooleanControl = withJsonFormsControlProps(BooleanControl);
const ConnectedEnumControl = withJsonFormsControlProps(EnumControl);
const ConnectedArrayControl = withJsonFormsArrayControlProps(ArrayControlRenderer);

export const customRenderers = [
  { tester: rankWith(1, uiTypeIs("VerticalLayout")), renderer: ConnectedVerticalLayout },
  { tester: rankWith(1, uiTypeIs("Group")), renderer: ConnectedGroupLayout },
  { tester: rankWith(10, isStringControl), renderer: ConnectedTextControl },
  { tester: rankWith(10, isNumberControl), renderer: ConnectedNumberControl },
  { tester: rankWith(10, isIntegerControl), renderer: ConnectedNumberControl },
  { tester: rankWith(10, isBooleanControl), renderer: ConnectedBooleanControl },
  { tester: rankWith(10, isEnumControl), renderer: ConnectedEnumControl },
  { tester: rankWith(10, isObjectArrayControl), renderer: ConnectedArrayControl },
];

export function JsonFormFields({
  schema,
  data,
  onChange,
}: {
  schema: Record<string, unknown>;
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}) {
  const { $schema: _, ...cleanSchema } = schema as Record<string, unknown> & {
    $schema?: string;
  };

  return (
    <JsonForms
      schema={cleanSchema as JsonSchema}
      data={data}
      renderers={customRenderers}
      onChange={({ data: formData }) => onChange(formData ?? {})}
      validationMode="ValidateAndShow"
    />
  );
}