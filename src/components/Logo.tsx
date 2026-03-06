const Logo = ({ white = false }: { white?: boolean }) => (
  <div className="flex items-center gap-2">
    <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
      <span className="text-primary-foreground font-bold text-sm">O</span>
    </div>
    <span className={`text-xl font-bold ${white ? 'text-primary-foreground' : 'text-foreground'}`}>
      organizze
    </span>
  </div>
);

export default Logo;
