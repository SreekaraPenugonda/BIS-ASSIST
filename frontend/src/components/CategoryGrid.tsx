import { motion } from "motion/react";
import { Files, TableProperties, WalletMinimal, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const HOME_CATEGORIES = [
  {
    id: "electrical",
    title: "Electrical & Electronics",
    icon: Zap,
    description: "Appliances, cables, plugs, LED, fans and more.",
    standards: 9,
  },
  {
    id: "food",
    title: "Food, Water & Packaging",
    icon: WalletMinimal,
    description: "Drinking water, packaged water, LPG appliances.",
    standards: 6,
  },
  {
    id: "construction",
    title: "Construction & Infrastructure",
    icon: Files,
    description: "Cement, TMT bars, concrete & steel works.",
    standards: 7,
  },
  {
    id: "safety",
    title: "Transportation & Safety",
    icon: TableProperties,
    description: "Helmets, fire extinguishers, toys & child safety.",
    standards: 6,
  },
] as const;

export function CategoryGrid({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {HOME_CATEGORIES.map((cat, i) => {
        const Icon = cat.icon;
        return (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.35, delay: i * 0.06 }}
          >
            <Card
              className={cn(
                "cursor-pointer transition-all hover:-translate-y-0.5 hover:border-primary/40 card-shadow",
              )}
            >
              <CardContent className="flex flex-col gap-2.5 pt-4">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="text-sm font-semibold">{cat.title}</h3>
                <p className="text-xs text-muted-foreground">{cat.description}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-primary"
                  onClick={() => onSelect(cat.id)}
                >
                  Browse standards →
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}