type StarIconProps = {
  fill?: string;
  size?: number;
  className?: string;
};

export default function StarIcon({ fill = "currentColor", size, className }: StarIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 0 C12.6 6.2 13.8 10.6 24 12 C13.8 13.4 12.6 17.8 12 24 C11.4 17.8 10.2 13.4 0 12 C10.2 10.6 11.4 6.2 12 0Z"
        fill={fill}
      />
    </svg>
  );
}
