const SummaryCard = ({ title, value, icon, accent = 'brand' }) => {
  const accentMap = {
    brand: 'bg-brand-50 text-brand-700',
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
  };
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${accentMap[accent]}`}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-800">{value}</div>
        <div className="text-sm text-gray-500">{title}</div>
      </div>
    </div>
  );
};

export default SummaryCard;
