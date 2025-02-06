// src/components/StatisticCard.tsx
import React from "react";
import { Card } from "react-bootstrap";

interface StatisticCardProps {
  title: string;
  value: number;
}

const StatisticCard: React.FC<StatisticCardProps> = ({ title, value }) => {
  return (
    <Card className="mb-4 shadow-sm">
      <Card.Body>
        <Card.Title>{title}</Card.Title>
        <Card.Text style={{ fontSize: "2rem", fontWeight: "bold" }}>
          {value}
        </Card.Text>
      </Card.Body>
    </Card>
  );
};

export default StatisticCard;
