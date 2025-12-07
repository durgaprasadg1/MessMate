const SelectBox = ({ label, name, value, onChange, options }) => (
  <div>
    <label className="block font-medium">{label}</label>
    <select
      name={name}
      className="w-full border p-2 rounded"
      value={value}
      onChange={onChange}
      required
    >
      {options.map((opt, i) => (
        <option key={i} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);
export default SelectBox;