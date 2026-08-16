type Option<T extends string> = {
  value: T;
  label: string;
  description: string;
};

export function RadioOptionGroup<T extends string>({
  legend,
  name,
  options,
  defaultValue,
}: {
  legend: string;
  name: string;
  options: Option<T>[];
  defaultValue: T;
}) {
  return (
    <fieldset className="project-form__field">
      <legend>{legend}</legend>
      {options.map((option) => (
        <label key={option.value} className="project-form__radio-option">
          <input
            type="radio"
            name={name}
            value={option.value}
            defaultChecked={option.value === defaultValue}
          />
          <span>
            <span className="project-form__radio-label">{option.label}</span>
            <span className="project-form__radio-description">
              {option.description}
            </span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}
