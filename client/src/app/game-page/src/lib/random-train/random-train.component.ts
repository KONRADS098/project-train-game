import { Component, inject, OnInit } from '@angular/core';
import { RandomTrainService } from "../services/random-train.service";
import { ExitStationTrain, Trip } from "@client/shared-models";
import { ActivatedRoute, Router } from "@angular/router";
import { TripService } from "../services/trip.service";
import { switchMap, tap } from "rxjs";
import { MatSnackBar } from "@angular/material/snack-bar";

@Component({
  templateUrl: './random-train.component.html',
  styleUrls: ['./random-train.component.scss']
})
export class RandomTrainComponent implements OnInit {
  private _randomTrainService: RandomTrainService = inject(RandomTrainService);
  private _route: ActivatedRoute = inject(ActivatedRoute);
  private _tripService: TripService = inject(TripService);
  private _randomTrain!: ExitStationTrain;
  private _snackbar: MatSnackBar = inject(MatSnackBar);
  private _router: Router = inject(Router);

  private tripId: string = "";
  private uicCode: string = "";
  private departureLocation: string = "";

  get departureLocationValue(): string {
    return this.departureLocation;
  }

  ngOnInit(): void {
    this._route.queryParams.subscribe((params) => {
      this.uicCode = params['uicCode'];
      this.departureLocation = params['location'];
      this.tripId = params['tripId'];
    });

    this.getRandomTrain();
  }

  getRandomTrain(): void {
    this._randomTrainService.getRandomTrain(this.uicCode)
      .subscribe(train => {
        const date = new Date(train.departure.plannedDateTime);
        const time = date.toLocaleTimeString([], {timeStyle: 'short'});

        this._randomTrain = train
        this._randomTrain.departure.plannedDateTime = time;

      });
  }

  saveTrip(): void {
    this._tripService.getTripById(this.tripId).pipe(
      switchMap((trip: Trip) => {
        trip.routeStations.push(
          {
            uicCode: this._randomTrain.exitStation.uicCode, 
            mediumName: this._randomTrain.exitStation.mediumName
          }
        );
        return this._tripService.saveTrip(trip);
      }),
      tap((response) => {
        let ref = this._snackbar.open(
          "Your trip progress has been saved!",
          "",
          { horizontalPosition: 'end', duration: 2000 }
        );

        ref.afterDismissed().subscribe(() => {
          this._router.navigate(['game/picture-upload'],
            {
              queryParams: {
                tripId: response.tripId,
                uicCode: this.uicCode,
                location: this._randomTrain.exitStation.mediumName
              }
            });
        });
      })
    ).subscribe();
  }

  get randomTrain(): ExitStationTrain {
    return this._randomTrain;
  }
}
