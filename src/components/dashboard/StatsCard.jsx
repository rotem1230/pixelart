import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

const colorStyles = {
  blue: {
    bg: "bg-blue-500",
    text: "text-blue-600",
    bgLight: "bg-blue-50",
    border: "border-blue-200"
  },
  purple: {
    bg: "bg-purple-500",
    text: "text-purple-600",
    bgLight: "bg-purple-50",
    border: "border-purple-200"
  },
  red: {
    bg: "bg-red-500",
    text: "text-red-600",
    bgLight: "bg-red-50",
    border: "border-red-200"
  },
  orange: {
    bg: "bg-orange-500",
    text: "text-orange-600",
    bgLight: "bg-orange-50",
    border: "border-orange-200"
  },
  green: {
    bg: "bg-green-500",
    text: "text-green-600",
    bgLight: "bg-green-50",
    border: "border-green-200"
  }
};

export default function StatsCard({ title, value, icon: Icon, color, trend, isIncrease = true }) {
  const styles = colorStyles[color] || colorStyles.blue;
  
  return (
    <Card className={`relative overflow-hidden ${styles.bgLight} ${styles.border} hover:shadow-lg transition-all duration-300`}>
      <div className={`absolute top-0 left-0 w-24 h-24 ${styles.bg} opacity-10 rounded-full transform -translate-x-8 -translate-y-8`} />
      
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-600">
            {title}
          </CardTitle>
          <div className={`p-2 rounded-lg ${styles.bgLight} ${styles.border}`}>
            <Icon className={`w-4 h-4 ${styles.text}`} />
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2">
          <div className="text-2xl font-bold text-gray-900">
            {value}
          </div>
          {trend && (
            <div className="flex items-center gap-1">
              {isIncrease ? (
                <TrendingUp className="w-3 h-3 text-green-500" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-500" />
              )}
              <span className="text-xs text-gray-500">
                {trend}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}