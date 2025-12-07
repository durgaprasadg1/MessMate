const FormInput = ({
  label,
  name,
  type,
  placeholder,
  value,
  onChange,
  error,
}) => (
  <div>
    <label className="block font-medium">{label}</label>
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      className="w-full border p-2 rounded"
      value={value}
      onChange={onChange}
      required
    />
    {error && <p className="text-red-600 text-sm">{error}</p>}
  </div>
);

export default FormInput;