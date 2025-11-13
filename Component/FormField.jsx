export default function FormField({
  label,
  type,
  name,
  value,
  onChange,
  required,
  rows,
  options,
}) {
  if (type === "textarea") {
    return (
      <div>
        <label className="block mb-1 font-medium">{label}</label>
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          rows={rows || 3}
          className="w-full border rounded-lg p-2"
          required={required}
        />
      </div>
    );
  }

  if (type === "select") {
    return (
      <div>
        <label className="block mb-1 font-medium">{label}</label>
        <select
          name={name}
          value={value}
          onChange={onChange}
          className="w-full border rounded-lg p-2"
          required={required}
        >
          <option value="">Select</option>
          {options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div>
      <label className="block mb-1 font-medium">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full border rounded-lg p-2"
        required={required}
      />
    </div>
  );
}
