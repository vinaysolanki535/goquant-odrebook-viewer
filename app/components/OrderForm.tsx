"use client";

import { useStore } from "@/lib/store";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect } from "react";
import { toast } from "sonner";
import { SimulatedOrder } from "@/lib/types";

const formSchema = z
  .object({
    side: z.enum(["buy", "sell"]),
    orderType: z.enum(["limit", "market"]),
    price: z.string().optional(),
    quantity: z
      .string()
      .min(1, { message: "Quantity is required." })
      .transform((val) => parseFloat(val))
      .refine((val) => val > 0, {
        message: "Quantity must be greater than zero.",
      }),
  })
  .refine(
    (data) => {
      if (data.orderType === "limit") {
        if (!data.price) return false;
        const priceValue = parseFloat(data.price);
        return !isNaN(priceValue) && priceValue > 0;
      }
      return true;
    },
    {
      message: "Price must be a positive number.",
      path: ["price"],
    }
  );

type FormInputData = z.input<typeof formSchema>;

export function OrderForm() {
  const { venue, symbol, addSimulationToHistory, updateSimulatedOrder } =
    useStore();

  const {
    control,
    watch,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<FormInputData>({
    resolver: zodResolver(formSchema),

    defaultValues: {
      side: "buy",
      orderType: "limit",
      price: "",
      quantity: "",
    },
    mode: "onChange",
  });

  const orderType = watch("orderType");

  useEffect(() => {
    const subscription = watch((value) => {
      const output: Partial<SimulatedOrder> = {
        side: value.side,
        orderType: value.orderType,
      };

      const quantity = parseFloat(value.quantity || "");
      output.quantity = isNaN(quantity) ? 0 : quantity;

      if (value.orderType === "limit") {
        const price = parseFloat(value.price || "");
        output.price = isNaN(price) ? 0 : price;
      } else {
        output.price = undefined;
      }

      updateSimulatedOrder({ ...output, venue, symbol });
    });
    return () => subscription.unsubscribe();
  }, [watch, updateSimulatedOrder, venue, symbol]);

  const onSubmit: SubmitHandler<FormInputData> = (data) => {
    const confirmedOrder: SimulatedOrder = {
      venue,
      symbol,
      side: data.side,
      orderType: data.orderType,
      quantity: parseFloat(data.quantity),
      price: data.price ? parseFloat(data.price) : 0,
      timestamp: Date.now(),
    };

    addSimulationToHistory(confirmedOrder);

    toast.success("Simulation Confirmed!", {
      description: `Logged ${confirmedOrder.side.toUpperCase()} order for ${
        confirmedOrder.quantity
      } ${symbol}.`,
    });

    reset();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Simulate Order</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Label>Order Type</Label>
            <Controller
              name="orderType"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="limit">Limit</SelectItem>
                    <SelectItem value="market">Market</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="flex flex-col space-y-2">
            <Label>Side</Label>
            <Controller
              name="side"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buy">Buy</SelectItem>
                    <SelectItem value="sell">Sell</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="flex flex-col space-y-2">
            <Label htmlFor="price">Price (USD)</Label>
            <Controller
              name="price"
              control={control}
              render={({ field }) => (
                <Input
                  id="price"
                  type="text"
                  inputMode="decimal"
                  {...field}
                  value={field.value ?? ""}
                  disabled={orderType === "market"}
                />
              )}
            />
            {errors.price && (
              <p className="text-red-500 text-xs mt-1">
                {errors.price.message}
              </p>
            )}
          </div>

          <div className="flex flex-col space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Controller
              name="quantity"
              control={control}
              render={({ field }) => (
                <Input
                  id="quantity"
                  type="text"
                  inputMode="decimal"
                  {...field}
                  value={field.value ?? ""}
                />
              )}
            />
            {errors.quantity && (
              <p className="text-red-500 text-xs mt-1">
                {errors.quantity.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={!isValid}>
            Confirm Simulation
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
